package com.himani.parkspot_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "zones")
@Data
@NoArgsConstructor
public class Zone {
    @Id
    private String id;
    private String name;          // "Myrtle Avenue (68 Street to 68 Place), N side"

    @JsonIgnore                   // never sent to the browser
    private String code;          // the number on the pole (pay_by_cell_number)

    private String meterNumber;
    private String borough;
    private String meterHours;
    private double lat;
    private double lon;
    private int capacity;
    private int currentCount;
}