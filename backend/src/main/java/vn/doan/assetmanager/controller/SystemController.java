package vn.doan.assetmanager.controller;

import javax.sql.DataSource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private static final String API_CONTRACT_VERSION = "5";

    private final DataSource dataSource;

    public SystemController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/database")
    public DatabaseStatus databaseStatus() throws java.sql.SQLException {
        try (var connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL();
            return new DatabaseStatus(
                    url.startsWith("jdbc:mysql:") ? "MySQL / XAMPP" : "H2",
                    API_CONTRACT_VERSION);
        }
    }

    public record DatabaseStatus(String database, String apiContractVersion) {
    }
}
