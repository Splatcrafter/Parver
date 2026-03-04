package de.splatgames.software.external.afbb.parver.parking;

import de.splatgames.software.external.afbb.parver.api.ParkingApiDelegate;
import de.splatgames.software.external.afbb.parver.model.CreateBookingRequest;
import de.splatgames.software.external.afbb.parver.model.CreateReleaseRequest;
import de.splatgames.software.external.afbb.parver.model.CreateReportRequest;
import de.splatgames.software.external.afbb.parver.model.ErrorResponse;
import de.splatgames.software.external.afbb.parver.model.ParkingSpace;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotBooking;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotRelease;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotReport;
import de.splatgames.software.external.afbb.parver.user.UserEntity;
import de.splatgames.software.external.afbb.parver.user.UserService;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ParkingApiDelegateImpl implements ParkingApiDelegate {

    private final ParkingSpotService parkingSpotService;
    private final UserService userService;

    public ParkingApiDelegateImpl(
            @NotNull final ParkingSpotService parkingSpotService,
            @NotNull final UserService userService) {
        this.parkingSpotService = parkingSpotService;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<List<ParkingSpace>> getParkingSpaces() {
        final LocalDateTime now = LocalDateTime.now(ParkingSpotMapper.APP_ZONE);
        final List<ParkingSpace> spaces = this.parkingSpotService.findAll().stream()
                .map(spot -> {
                    final ParkingSpotStatus status = this.parkingSpotService.computeStatus(spot, now);
                    final List<ParkingSpotReleaseEntity> releases =
                            this.parkingSpotService.getActiveReleases(spot.getSpotNumber());
                    return ParkingSpotMapper.toResponse(spot, status, releases, now);
                })
                .toList();
        return ResponseEntity.ok(spaces);
    }

    @Override
    public ResponseEntity<ParkingSpotRelease> createRelease(
            @NotNull final Integer spotNumber,
            @NotNull final CreateReleaseRequest request) {
        try {
            final long userId = getAuthenticatedUserId();
            final ParkingSpotReleaseEntity release = this.parkingSpotService.createRelease(
                    spotNumber, userId,
                    ParkingSpotMapper.toAppLocalDateTime(request.getAvailableFrom()),
                    ParkingSpotMapper.toAppLocalDateTime(request.getAvailableTo()));
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ParkingSpotMapper.toReleaseResponse(release));
        } catch (final SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN,
                    "Keine Berechtigung", "Nur der Inhaber kann diesen Parkplatz freigeben.");
        } catch (final IllegalArgumentException e) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Ungültige Eingabe", mapReleaseValidationError(e.getMessage()));
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Der Parkplatz wurde nicht gefunden.");
        }
    }

    @Override
    public ResponseEntity<Void> deleteRelease(
            @NotNull final Integer spotNumber,
            @NotNull final Long releaseId) {
        try {
            final long userId = getAuthenticatedUserId();
            this.parkingSpotService.deleteRelease(releaseId, userId);
            return ResponseEntity.noContent().build();
        } catch (final SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN,
                    "Keine Berechtigung", "Nur der Inhaber kann diese Freigabe löschen.");
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Die Freigabe wurde nicht gefunden.");
        }
    }

    @Override
    public ResponseEntity<ParkingSpotBooking> createBooking(
            @NotNull final Integer spotNumber,
            @NotNull final CreateBookingRequest request) {
        try {
            final long userId = getAuthenticatedUserId();
            final ParkingSpotBookingEntity booking = this.parkingSpotService.createBooking(
                    spotNumber, request.getReleaseId(), userId,
                    ParkingSpotMapper.toAppLocalDateTime(request.getBookedFrom()),
                    ParkingSpotMapper.toAppLocalDateTime(request.getBookedTo()));
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ParkingSpotMapper.toBookingResponse(booking));
        } catch (final SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN,
                    "Keine Berechtigung", "Sie besitzen bereits einen eigenen Parkplatz und können keinen weiteren buchen.");
        } catch (final IllegalArgumentException e) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Ungültige Eingabe", mapBookingValidationError(e.getMessage()));
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Der Parkplatz oder die Freigabe wurde nicht gefunden.");
        }
    }

    @Override
    public ResponseEntity<Void> deleteBooking(
            @NotNull final Integer spotNumber,
            @NotNull final Long bookingId) {
        try {
            final long userId = getAuthenticatedUserId();
            final boolean isAdmin = isCurrentUserAdmin();
            this.parkingSpotService.deleteBooking(bookingId, userId, isAdmin);
            return ResponseEntity.noContent().build();
        } catch (final SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN,
                    "Keine Berechtigung", "Sie können nur eigene Buchungen stornieren.");
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Die Buchung wurde nicht gefunden.");
        }
    }

    @Override
    public ResponseEntity<ParkingSpotReport> createReport(
            @NotNull final Integer spotNumber,
            @NotNull final CreateReportRequest request) {
        try {
            final long userId = getAuthenticatedUserId();
            final ParkingSpotReportEntity report = this.parkingSpotService.createReport(
                    spotNumber, userId, request.getComment());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ParkingSpotMapper.toReportResponse(report));
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Der Parkplatz wurde nicht gefunden.");
        }
    }

    // --- Error helpers ---

    @SuppressWarnings("unchecked")
    private static <T> ResponseEntity<T> errorResponse(
            @NotNull final HttpStatus status,
            @NotNull final String error,
            @NotNull final String message) {
        final ErrorResponse body = new ErrorResponse(error, message, OffsetDateTime.now());
        return (ResponseEntity<T>) ResponseEntity.status(status).body(body);
    }

    private static String mapReleaseValidationError(@NotNull final String msg) {
        if (msg.contains("before")) {
            return "Der Startzeitpunkt muss vor dem Endzeitpunkt liegen.";
        }
        if (msg.contains("overlaps")) {
            return "Es existiert bereits eine Freigabe in diesem Zeitraum.";
        }
        return "Die Eingabe ist ungültig. Bitte überprüfen Sie die Zeiträume.";
    }

    private static String mapBookingValidationError(@NotNull final String msg) {
        if (msg.contains("before")) {
            return "Der Startzeitpunkt muss vor dem Endzeitpunkt liegen.";
        }
        if (msg.contains("within the release window")) {
            return "Der Buchungszeitraum muss innerhalb der Freigabe liegen.";
        }
        if (msg.contains("overlaps")) {
            return "Dieser Zeitraum ist bereits gebucht.";
        }
        if (msg.contains("does not belong")) {
            return "Die Freigabe gehört nicht zu diesem Parkplatz.";
        }
        return "Die Eingabe ist ungültig. Bitte überprüfen Sie die Zeiträume.";
    }

    // --- Auth helpers ---

    private long getAuthenticatedUserId() {
        final Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        final String username = auth.getName();
        final UserEntity user = this.userService.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("Authenticated user not found"));
        return user.getId();
    }

    private boolean isCurrentUserAdmin() {
        final Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
