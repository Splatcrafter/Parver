package de.splatgames.software.external.afbb.parver.parking;

import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ParkingSpotBookingRepository extends JpaRepository<ParkingSpotBookingEntity, Long> {

    @Query("SELECT b FROM ParkingSpotBookingEntity b WHERE b.release.id = :releaseId " +
            "AND b.bookedFrom < :to AND b.bookedTo > :from")
    @NotNull
    List<ParkingSpotBookingEntity> findOverlapping(@Param("releaseId") long releaseId,
                                                    @NotNull @Param("from") LocalDateTime from,
                                                    @NotNull @Param("to") LocalDateTime to);

    @NotNull
    List<ParkingSpotBookingEntity> findByBookedById(long userId);
}
