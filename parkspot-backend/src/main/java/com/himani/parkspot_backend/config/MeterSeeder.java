package com.himani.parkspot_backend.config;

import com.himani.parkspot_backend.model.Zone;
import com.himani.parkspot_backend.repository.ZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@Component
public class MeterSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MeterSeeder.class);
    private static final int[] CAPACITIES = {4, 5, 7, 10};

    private final ZoneRepository zoneRepository;
    private final ObjectMapper objectMapper;

    public MeterSeeder(ZoneRepository zoneRepository, ObjectMapper objectMapper) {
        this.zoneRepository = zoneRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        if (zoneRepository.count() > 0) {
            log.info("Zones already exist, skipping seed");
            return;
        }

        List<Map<String, String>> rows;
        try (InputStream in = new ClassPathResource("data/meters.json").getInputStream()) {
            rows = objectMapper.readValue(in, new TypeReference<List<Map<String, String>>>() {});
        }

        Set<String> seenCodes = new HashSet<>();
        List<Zone> zones = new ArrayList<>();

        for (Map<String, String> row : rows) {
            String code = clean(row.get("pay_by_cell_number"));
            String street = clean(row.get("on_street"));
            Double lat = parse(row.get("lat"));
            Double lon = parse(row.get("long"));
            String status = clean(row.get("status"));

            if (code == null || street == null || lat == null || lon == null) continue;
            if (status != null && !status.equalsIgnoreCase("Active")) continue;
            if (lat < 40.4 || lat > 41.0 || lon < -74.3 || lon > -73.6) continue;   // not in NYC
            if (!seenCodes.add(code)) continue;                                      // codes must be unique

            Zone zone = new Zone();
            zone.setName(buildName(street, row.get("from_street"), row.get("to_street"), row.get("side_of_street")));
            zone.setCode(code);
            zone.setMeterNumber(clean(row.get("meter_number")));
            zone.setBorough(clean(row.get("borough")));
            zone.setMeterHours(clean(row.get("meter_hours")));
            zone.setLat(lat);
            zone.setLon(lon);
            // seeded from the code, so the same meter gets the same capacity every time
            zone.setCapacity(CAPACITIES[new Random(code.hashCode()).nextInt(CAPACITIES.length)]);
            zone.setCurrentCount(0);
            zones.add(zone);
        }

        zoneRepository.saveAll(zones);
        log.info("Seeded {} zones from {} meter rows", zones.size(), rows.size());
    }

    private static String buildName(String street, String from, String to, String side) {
        StringBuilder name = new StringBuilder(titleCase(street));
        String f = clean(from);
        String t = clean(to);
        if (f != null && t != null) {
            name.append(" (").append(titleCase(f)).append(" to ").append(titleCase(t)).append(")");
        }
        String s = clean(side);
        if (s != null) {
            name.append(", ").append(s.toUpperCase()).append(" side");
        }
        return name.toString();
    }

    private static String titleCase(String text) {
        StringBuilder out = new StringBuilder();
        for (String word : text.trim().toLowerCase().split("\\s+")) {
            if (word.isEmpty()) continue;
            if (out.length() > 0) out.append(' ');
            out.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return out.toString();
    }

    private static String clean(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static Double parse(String value) {
        try {
            return value == null ? null : Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}