package de.splatgames.software.external.afbb.parver.parking;

import de.splatgames.software.external.afbb.parver.model.ParkingSpace;
import de.splatgames.software.external.afbb.parver.notification.PushNotificationService;
import de.splatgames.software.external.afbb.parver.user.UserEntity;
import de.splatgames.software.external.afbb.parver.user.UserRepository;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
public class ParkingSpotServiceImpl implements ParkingSpotService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final ParkingSpotRepository parkingSpotRepository;
    private final ParkingSpotReleaseRepository releaseRepository;
    private final ParkingSpotBookingRepository bookingRepository;
    private final ParkingSpotReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SseEmitterService sseEmitterService;
    private final PushNotificationService pushNotificationService;

    public ParkingSpotServiceImpl(
            @NotNull final ParkingSpotRepository parkingSpotRepository,
            @NotNull final ParkingSpotReleaseRepository releaseRepository,
            @NotNull final ParkingSpotBookingRepository bookingRepository,
            @NotNull final ParkingSpotReportRepository reportRepository,
            @NotNull final UserRepository userRepository,
            @NotNull final SseEmitterService sseEmitterService,
            @NotNull final PushNotificationService pushNotificationService) {
        this.parkingSpotRepository = parkingSpotRepository;
        this.releaseRepository = releaseRepository;
        this.bookingRepository = bookingRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.sseEmitterService = sseEmitterService;
        this.pushNotificationService = pushNotificationService;
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public List<ParkingSpotEntity> findAll() {
        return this.parkingSpotRepository.findAll();
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public Optional<ParkingSpotEntity> findBySpotNumber(final int spotNumber) {
        return this.parkingSpotRepository.findById(spotNumber);
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public Optional<ParkingSpotEntity> findByOwnerId(final long ownerId) {
        return this.parkingSpotRepository.findByOwnerId(ownerId);
    }

    @Override
    @NotNull
    public ParkingSpotEntity createSpot(final int spotNumber, @NotNull final String area) {
        if (this.parkingSpotRepository.existsById(spotNumber)) {
            throw new IllegalArgumentException("Parking spot already exists: " + spotNumber);
        }
        return this.parkingSpotRepository.save(new ParkingSpotEntity(spotNumber, area));
    }

    @Override
    public void assignOwner(final int spotNumber, final long userId) {
        final ParkingSpotEntity spot = this.parkingSpotRepository.findById(spotNumber)
                .orElseThrow(() -> new NoSuchElementException("Parking spot not found: " + spotNumber));

        final UserEntity user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        this.parkingSpotRepository.findByOwnerId(userId)
                .ifPresent(existingSpot -> existingSpot.setOwner(null));

        spot.setOwner(user);
        this.parkingSpotRepository.save(spot);
    }

    @Override
    public void removeOwner(final int spotNumber) {
        final ParkingSpotEntity spot = this.parkingSpotRepository.findById(spotNumber)
                .orElseThrow(() -> new NoSuchElementException("Parking spot not found: " + spotNumber));
        spot.setOwner(null);
        this.parkingSpotRepository.save(spot);
    }

    @Override
    public void clearSpotData(final int spotNumber) {
        final List<ParkingSpotReleaseEntity> releases =
                this.releaseRepository.findByParkingSpotSpotNumber(spotNumber);
        this.releaseRepository.deleteAll(releases); // cascades to bookings via orphanRemoval
    }

    @Override
    public void deleteBookingsByUser(final long userId) {
        final List<ParkingSpotBookingEntity> bookings =
                this.bookingRepository.findByBookedById(userId);
        this.bookingRepository.deleteAll(bookings);
    }

    // --- Release management ---

    @Override
    @NotNull
    public ParkingSpotReleaseEntity createRelease(final int spotNumber, final long userId,
                                                   @NotNull final LocalDateTime from,
                                                   @NotNull final LocalDateTime to) {
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("availableFrom must be before availableTo");
        }

        final ParkingSpotEntity spot = this.parkingSpotRepository.findById(spotNumber)
                .orElseThrow(() -> new NoSuchElementException("Parking spot not found: " + spotNumber));

        if (spot.getOwner() == null || !spot.getOwner().getId().equals(userId)) {
            throw new SecurityException("Only the owner can release this spot");
        }

        final List<ParkingSpotReleaseEntity> overlapping =
                this.releaseRepository.findOverlapping(spotNumber, from, to);
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Release overlaps with an existing release");
        }

        final var release = new ParkingSpotReleaseEntity(spot, from, to);
        final ParkingSpotReleaseEntity saved = this.releaseRepository.save(release);

        broadcastParkingUpdate();

        // Notify users who are seeking parking
        final String ownerName = spot.getOwner().getDisplayName();
        this.pushNotificationService.notifySeekingUsers(
                "Parkplatz " + spotNumber + " ist jetzt verfügbar!",
                ownerName + " hat freigegeben: " + from.format(DATE_FMT) + " - " + to.format(DATE_FMT));

        return saved;
    }

    @Override
    public void deleteRelease(final long releaseId, final long userId) {
        final ParkingSpotReleaseEntity release = this.releaseRepository.findById(releaseId)
                .orElseThrow(() -> new NoSuchElementException("Release not found: " + releaseId));

        if (!release.getParkingSpot().getOwner().getId().equals(userId)) {
            throw new SecurityException("Only the owner can delete this release");
        }

        // Cascade deletes bookings via orphanRemoval
        this.releaseRepository.delete(release);
        broadcastParkingUpdate();
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public List<ParkingSpotReleaseEntity> getActiveReleases(final int spotNumber) {
        return this.releaseRepository.findByParkingSpotSpotNumberAndAvailableToAfter(
                spotNumber, LocalDateTime.now(ParkingSpotMapper.APP_ZONE));
    }

    // --- Booking management ---

    @Override
    @NotNull
    public ParkingSpotBookingEntity createBooking(final int spotNumber, final long releaseId,
                                                   final long userId,
                                                   @NotNull final LocalDateTime from,
                                                   @NotNull final LocalDateTime to) {
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("bookedFrom must be before bookedTo");
        }

        final UserEntity user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        if (user.hasParkingSpot()) {
            throw new SecurityException("Users with their own parking spot cannot book");
        }

        final ParkingSpotReleaseEntity release = this.releaseRepository.findById(releaseId)
                .orElseThrow(() -> new NoSuchElementException("Release not found: " + releaseId));

        if (release.getParkingSpot().getSpotNumber() != spotNumber) {
            throw new IllegalArgumentException("Release does not belong to spot " + spotNumber);
        }

        // Booking must be within release window
        if (from.isBefore(release.getAvailableFrom()) || to.isAfter(release.getAvailableTo())) {
            throw new IllegalArgumentException("Booking must be within the release window");
        }

        // No overlapping bookings
        final List<ParkingSpotBookingEntity> overlapping =
                this.bookingRepository.findOverlapping(releaseId, from, to);
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Booking overlaps with an existing booking");
        }

        final var booking = new ParkingSpotBookingEntity(release, user, from, to);
        final ParkingSpotBookingEntity saved = this.bookingRepository.save(booking);
        broadcastParkingUpdate();
        return saved;
    }

    @Override
    public void deleteBooking(final long bookingId, final long userId, final boolean isAdmin) {
        final ParkingSpotBookingEntity booking = this.bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Booking not found: " + bookingId));

        if (!isAdmin && !booking.getBookedBy().getId().equals(userId)) {
            throw new SecurityException("Only the booker or an admin can cancel this booking");
        }

        this.bookingRepository.delete(booking);
        broadcastParkingUpdate();
    }

    // --- Status computation ---

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public ParkingSpotStatus computeStatus(@NotNull final ParkingSpotEntity spot,
                                            @NotNull final LocalDateTime now) {
        if (spot.getOwner() == null) {
            return ParkingSpotStatus.INACTIVE;
        }

        final List<ParkingSpotReleaseEntity> releases =
                this.releaseRepository.findByParkingSpotSpotNumber(spot.getSpotNumber());

        // Find a release that covers 'now'
        final ParkingSpotReleaseEntity activeRelease = releases.stream()
                .filter(r -> r.containsTime(now))
                .findFirst()
                .orElse(null);

        if (activeRelease == null) {
            return ParkingSpotStatus.OCCUPIED;
        }

        // Check if there's a booking within this release that covers 'now'
        final boolean isBooked = activeRelease.getBookings().stream()
                .anyMatch(b -> b.containsTime(now));

        return isBooked ? ParkingSpotStatus.BOOKED : ParkingSpotStatus.AVAILABLE;
    }

    // --- Report management ---

    @Override
    @NotNull
    public ParkingSpotReportEntity createReport(final int spotNumber, final long reporterId,
                                                 @Nullable final String comment) {
        final ParkingSpotEntity spot = this.parkingSpotRepository.findById(spotNumber)
                .orElseThrow(() -> new NoSuchElementException("Parking spot not found: " + spotNumber));

        final UserEntity reporter = this.userRepository.findById(reporterId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + reporterId));

        final var report = new ParkingSpotReportEntity(spot, reporter, comment);
        return this.reportRepository.save(report);
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public List<ParkingSpotReportEntity> getAllReports() {
        return this.reportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public void deleteReportsByReporter(final long reporterId) {
        this.reportRepository.deleteByReporterId(reporterId);
    }

    @Override
    public void updateReportStatus(final long reportId, @NotNull final ReportStatus status) {
        final ParkingSpotReportEntity report = this.reportRepository.findById(reportId)
                .orElseThrow(() -> new NoSuchElementException("Report not found: " + reportId));
        report.setStatus(status);
        this.reportRepository.save(report);
    }

    // --- Parking spaces response (used by SSE and REST) ---

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public List<ParkingSpace> buildParkingSpacesResponse() {
        return buildParkingSpacesResponse(null);
    }

    @Override
    @NotNull
    @Transactional(readOnly = true)
    public List<ParkingSpace> buildParkingSpacesResponse(@Nullable final String area) {
        final LocalDateTime now = LocalDateTime.now(ParkingSpotMapper.APP_ZONE);
        final List<ParkingSpotEntity> spots = area != null
                ? this.parkingSpotRepository.findByArea(area)
                : this.parkingSpotRepository.findAll();
        return spots.stream()
                .map(spot -> {
                    final ParkingSpotStatus status = computeStatus(spot, now);
                    final List<ParkingSpotReleaseEntity> releases =
                            this.releaseRepository.findByParkingSpotSpotNumberAndAvailableToAfter(
                                    spot.getSpotNumber(), now);
                    return ParkingSpotMapper.toResponse(spot, status, releases, now);
                })
                .toList();
    }

    // --- SSE broadcast ---

    private void broadcastParkingUpdate() {
        // Flush pending changes (deletes, inserts) so the subsequent query sees committed state
        this.parkingSpotRepository.flush();
        this.sseEmitterService.broadcast(buildParkingSpacesResponse());
    }
}
