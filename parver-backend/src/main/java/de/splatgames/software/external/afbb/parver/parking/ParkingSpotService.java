package de.splatgames.software.external.afbb.parver.parking;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ParkingSpotService {

    @NotNull
    List<ParkingSpotEntity> findAll();

    @NotNull
    Optional<ParkingSpotEntity> findBySpotNumber(int spotNumber);

    @NotNull
    Optional<ParkingSpotEntity> findByOwnerId(long ownerId);

    @NotNull
    ParkingSpotEntity createSpot(int spotNumber);

    void assignOwner(int spotNumber, long userId);

    void removeOwner(int spotNumber);

    void clearSpotData(int spotNumber);

    void deleteBookingsByUser(long userId);

    // Release management
    @NotNull
    ParkingSpotReleaseEntity createRelease(int spotNumber, long userId,
                                            @NotNull LocalDateTime from, @NotNull LocalDateTime to);

    void deleteRelease(long releaseId, long userId);

    @NotNull
    List<ParkingSpotReleaseEntity> getActiveReleases(int spotNumber);

    // Booking management
    @NotNull
    ParkingSpotBookingEntity createBooking(int spotNumber, long releaseId, long userId,
                                            @NotNull LocalDateTime from, @NotNull LocalDateTime to);

    void deleteBooking(long bookingId, long userId, boolean isAdmin);

    // Status computation
    @NotNull
    ParkingSpotStatus computeStatus(@NotNull ParkingSpotEntity spot, @NotNull LocalDateTime now);

    // Report management
    @NotNull
    ParkingSpotReportEntity createReport(int spotNumber, long reporterId, @Nullable String comment);

    @NotNull
    java.util.List<ParkingSpotReportEntity> getAllReports();

    void updateReportStatus(long reportId, @NotNull ReportStatus status);
}
