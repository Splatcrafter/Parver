package de.splatgames.software.external.afbb.parver.parking;

import de.splatgames.software.external.afbb.parver.user.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.time.Instant;

@Entity
@Table(name = "parking_spot_reports")
public class ParkingSpotReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "spot_number", nullable = false)
    private ParkingSpotEntity parkingSpot;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private UserEntity reporter;

    @Column(name = "comment", length = 500)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReportStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ParkingSpotReportEntity() {
        // JPA
    }

    public ParkingSpotReportEntity(@NotNull final ParkingSpotEntity parkingSpot,
                                   @NotNull final UserEntity reporter,
                                   @Nullable final String comment) {
        this.parkingSpot = parkingSpot;
        this.reporter = reporter;
        this.comment = comment;
        this.status = ReportStatus.OPEN;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    @NotNull
    public Long getId() {
        return this.id;
    }

    @NotNull
    public ParkingSpotEntity getParkingSpot() {
        return this.parkingSpot;
    }

    @NotNull
    public UserEntity getReporter() {
        return this.reporter;
    }

    @Nullable
    public String getComment() {
        return this.comment;
    }

    @NotNull
    public ReportStatus getStatus() {
        return this.status;
    }

    public void setStatus(@NotNull final ReportStatus status) {
        this.status = status;
    }

    @NotNull
    public Instant getCreatedAt() {
        return this.createdAt;
    }
}
