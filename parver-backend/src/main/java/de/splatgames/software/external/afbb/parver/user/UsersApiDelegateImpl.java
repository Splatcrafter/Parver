package de.splatgames.software.external.afbb.parver.user;

import de.splatgames.software.external.afbb.parver.api.UsersApiDelegate;
import de.splatgames.software.external.afbb.parver.model.CreateUserRequest;
import de.splatgames.software.external.afbb.parver.model.ErrorResponse;
import de.splatgames.software.external.afbb.parver.model.UpdateUserRequest;
import de.splatgames.software.external.afbb.parver.model.UserResponse;
import de.splatgames.software.external.afbb.parver.notification.PushNotificationService;
import de.splatgames.software.external.afbb.parver.parking.ParkingSpotEntity;
import de.splatgames.software.external.afbb.parver.parking.ParkingSpotService;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class UsersApiDelegateImpl implements UsersApiDelegate {

    private final UserService userService;
    private final ParkingSpotService parkingSpotService;
    private final PushNotificationService pushNotificationService;

    public UsersApiDelegateImpl(
            @NotNull final UserService userService,
            @NotNull final ParkingSpotService parkingSpotService,
            @NotNull final PushNotificationService pushNotificationService) {
        this.userService = userService;
        this.parkingSpotService = parkingSpotService;
        this.pushNotificationService = pushNotificationService;
    }

    @Override
    public ResponseEntity<List<UserResponse>> getUsers() {
        final List<UserResponse> users = this.userService.findAll().stream()
                .map(UserMapper::toResponse)
                .toList();
        return ResponseEntity.ok(users);
    }

    @Override
    public ResponseEntity<UserResponse> createUser(@NotNull final CreateUserRequest request) {
        try {
            final UserEntity entity = this.userService.createUser(
                    request.getUsername(),
                    request.getDisplayName(),
                    request.getPassword(),
                    UserRole.valueOf(request.getRole().name()));

            if (request.getParkingSpotNumber() != null) {
                this.parkingSpotService.assignOwner(
                        request.getParkingSpotNumber(), entity.getId());
            }

            final UserEntity refreshed = this.userService.findById(entity.getId()).orElseThrow();
            return ResponseEntity.status(HttpStatus.CREATED).body(UserMapper.toResponse(refreshed));
        } catch (final IllegalArgumentException e) {
            return errorResponse(HttpStatus.CONFLICT,
                    "Konflikt", "Der Benutzername ist bereits vergeben.");
        }
    }

    @Override
    public ResponseEntity<UserResponse> getUserById(@NotNull final Long userId) {
        return this.userService.findById(userId)
                .map(entity -> ResponseEntity.ok(UserMapper.toResponse(entity)))
                .orElseGet(() -> errorResponse(HttpStatus.NOT_FOUND,
                        "Nicht gefunden", "Der Benutzer wurde nicht gefunden."));
    }

    @Override
    public ResponseEntity<UserResponse> updateUser(
            @NotNull final Long userId,
            @NotNull final UpdateUserRequest request) {
        try {
            this.userService.updateUser(
                    userId,
                    request.getDisplayName(),
                    request.getPassword(),
                    UserRole.valueOf(request.getRole().name()));

            // Handle parking spot assignment
            final ParkingSpotEntity currentSpot =
                    this.parkingSpotService.findByOwnerId(userId).orElse(null);
            final Integer requestedSpot = request.getParkingSpotNumber();

            if (requestedSpot == null && currentSpot != null) {
                this.parkingSpotService.removeOwner(currentSpot.getSpotNumber());
            } else if (requestedSpot != null) {
                if (currentSpot == null || !currentSpot.getSpotNumber().equals(requestedSpot)) {
                    this.parkingSpotService.assignOwner(requestedSpot, userId);
                }
            }

            final UserEntity refreshed = this.userService.findById(userId).orElseThrow();
            return ResponseEntity.ok(UserMapper.toResponse(refreshed));
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Der Benutzer wurde nicht gefunden.");
        }
    }

    @Override
    public ResponseEntity<Void> deleteUser(@NotNull final Long userId) {
        try {
            // Delete push subscription for this user
            this.pushNotificationService.unsubscribe(userId);

            // Delete all reports filed by this user
            this.parkingSpotService.deleteReportsByReporter(userId);

            // Delete all bookings this user made on other spots
            this.parkingSpotService.deleteBookingsByUser(userId);

            // Delete all releases (+ cascaded bookings) for the user's own spot, then unassign
            this.parkingSpotService.findByOwnerId(userId)
                    .ifPresent(spot -> {
                        this.parkingSpotService.clearSpotData(spot.getSpotNumber());
                        this.parkingSpotService.removeOwner(spot.getSpotNumber());
                    });

            this.userService.deleteUser(userId);
            return ResponseEntity.noContent().build();
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Der Benutzer wurde nicht gefunden.");
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> ResponseEntity<T> errorResponse(
            @NotNull final HttpStatus status,
            @NotNull final String error,
            @NotNull final String message) {
        final ErrorResponse body = new ErrorResponse(error, message, OffsetDateTime.now());
        return (ResponseEntity<T>) ResponseEntity.status(status).body(body);
    }
}
