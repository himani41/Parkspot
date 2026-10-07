package com.himani.parkspot_backend.repository;

import com.himani.parkspot_backend.model.Zone;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ZoneRepository extends MongoRepository<Zone, String> {
    List<Zone> findByLatBetweenAndLonBetween(double south, double north, double west, double east, Pageable pageable);
}
