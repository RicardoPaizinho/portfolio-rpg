package com.ricardo.portfolio;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // origem do Vite em dev
public class LocationController {

    // Serve o conteúdo de src/main/resources/data/locations.json.
    // Em produção, isso viraria uma consulta a um banco de dados.
    @GetMapping(value = "/api/locations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getLocations() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/locations.json");
        String json = Files.readString(resource.getFile().toPath(), StandardCharsets.UTF_8);
        return ResponseEntity.ok(json);
    }
}
