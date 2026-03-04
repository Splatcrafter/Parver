package de.splatgames.software.external.afbb.parver.parking;

import de.splatgames.software.external.afbb.parver.model.ParkingSpace;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotBooking;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotRelease;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotReport;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

public final class ParkingSpotMapper {

    static final ZoneId APP_ZONE = ZoneId.of("Europe/Berlin");

    private ParkingSpotMapper() {
        // Utility class
    }

    @NotNull
    public static ParkingSpace toResponse(@NotNull final ParkingSpotEntity entity,
                                           @NotNull final ParkingSpotStatus status,
                                           @NotNull final List<ParkingSpotReleaseEntity> activeReleases,
                                           @NotNull final LocalDateTime now) {
        final ParkingSpace response = new ParkingSpace()
                .spotNumber(entity.getSpotNumber())
                .status(ParkingSpace.StatusEnum.valueOf(status.name()));

        if (entity.getOwner() != null) {
            response.ownerDisplayName(entity.getOwner().getDisplayName());
            response.ownerId(entity.getOwner().getId());
        }

        // Find current booker if status is BOOKED
        if (status == ParkingSpotStatus.BOOKED) {
            activeReleases.stream()
                    .filter(r -> r.containsTime(now))
                    .flatMap(r -> r.getBookings().stream())
                    .filter(b -> b.containsTime(now))
                    .findFirst()
                    .ifPresent(b -> response.currentBookerDisplayName(
                            b.getBookedBy().getDisplayName()));
        }

        // Map active releases
        final List<ParkingSpotRelease> releaseDtos = activeReleases.stream()
                .map(ParkingSpotMapper::toReleaseResponse)
                .toList();
        response.activeReleases(releaseDtos);

        return response;
    }

    @NotNull
    public static ParkingSpotRelease toReleaseResponse(
            @NotNull final ParkingSpotReleaseEntity entity) {
        final ParkingSpotRelease dto = new ParkingSpotRelease()
                .id(entity.getId())
                .spotNumber(entity.getParkingSpot().getSpotNumber())
                .availableFrom(toOffsetDateTime(entity.getAvailableFrom()))
                .availableTo(toOffsetDateTime(entity.getAvailableTo()));

        final List<ParkingSpotBooking> bookingDtos = entity.getBookings().stream()
                .map(ParkingSpotMapper::toBookingResponse)
                .toList();
        dto.bookings(bookingDtos);

        return dto;
    }

    @NotNull
    public static ParkingSpotBooking toBookingResponse(
            @NotNull final ParkingSpotBookingEntity entity) {
        return new ParkingSpotBooking()
                .id(entity.getId())
                .spotNumber(entity.getRelease().getParkingSpot().getSpotNumber())
                .bookedByDisplayName(entity.getBookedBy().getDisplayName())
                .bookedById(entity.getBookedBy().getId())
                .bookedFrom(toOffsetDateTime(entity.getBookedFrom()))
                .bookedTo(toOffsetDateTime(entity.getBookedTo()));
    }

    private static OffsetDateTime toOffsetDateTime(@NotNull final LocalDateTime ldt) {
        return ldt.atZone(APP_ZONE).toOffsetDateTime();
    }

    /**
     * Converts an incoming OffsetDateTime to LocalDateTime in the app timezone (Europe/Berlin).
     * Unlike {@code odt.toLocalDateTime()} which just strips the offset,
     * this properly converts the instant to German local time.
     */
    @NotNull
    public static LocalDateTime toAppLocalDateTime(@NotNull final OffsetDateTime odt) {
        return odt.atZoneSameInstant(APP_ZONE).toLocalDateTime();
    }

    @NotNull
    public static ParkingSpotReport toReportResponse(
            @NotNull final ParkingSpotReportEntity entity) {
        return new ParkingSpotReport()
                .id(entity.getId())
                .spotNumber(entity.getParkingSpot().getSpotNumber())
                .reporterDisplayName(entity.getReporter().getDisplayName())
                .reporterId(entity.getReporter().getId())
                .comment(entity.getComment())
                .status(ParkingSpotReport.StatusEnum.valueOf(entity.getStatus().name()))
                .createdAt(entity.getCreatedAt().atZone(APP_ZONE).toOffsetDateTime());
    }
}
