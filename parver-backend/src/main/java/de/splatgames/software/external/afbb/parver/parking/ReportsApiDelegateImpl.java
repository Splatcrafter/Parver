package de.splatgames.software.external.afbb.parver.parking;

import de.splatgames.software.external.afbb.parver.api.ReportsApiDelegate;
import de.splatgames.software.external.afbb.parver.model.ErrorResponse;
import de.splatgames.software.external.afbb.parver.model.ParkingSpotReport;
import de.splatgames.software.external.afbb.parver.model.UpdateReportStatusRequest;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReportsApiDelegateImpl implements ReportsApiDelegate {

    private final ParkingSpotService parkingSpotService;

    public ReportsApiDelegateImpl(@NotNull final ParkingSpotService parkingSpotService) {
        this.parkingSpotService = parkingSpotService;
    }

    @Override
    public ResponseEntity<List<ParkingSpotReport>> getReports() {
        final List<ParkingSpotReport> reports = this.parkingSpotService.getAllReports().stream()
                .map(ParkingSpotMapper::toReportResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    @Override
    public ResponseEntity<ParkingSpotReport> updateReportStatus(
            @NotNull final Long reportId,
            @NotNull final UpdateReportStatusRequest request) {
        try {
            final ReportStatus status = ReportStatus.valueOf(request.getStatus().name());
            this.parkingSpotService.updateReportStatus(reportId, status);
            final ParkingSpotReportEntity updated = this.parkingSpotService.getAllReports().stream()
                    .filter(r -> r.getId().equals(reportId))
                    .findFirst()
                    .orElseThrow();
            return ResponseEntity.ok(ParkingSpotMapper.toReportResponse(updated));
        } catch (final NoSuchElementException e) {
            return errorResponse(HttpStatus.NOT_FOUND,
                    "Nicht gefunden", "Die Meldung wurde nicht gefunden.");
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
