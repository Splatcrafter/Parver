package de.splatgames.software.external.afbb.parver.parking;

import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSpotReportRepository extends JpaRepository<ParkingSpotReportEntity, Long> {

    @NotNull
    List<ParkingSpotReportEntity> findAllByOrderByCreatedAtDesc();

    void deleteByReporterId(long reporterId);
}
