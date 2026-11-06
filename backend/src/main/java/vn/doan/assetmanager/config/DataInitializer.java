package vn.doan.assetmanager.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.doan.assetmanager.model.AppUser;
import vn.doan.assetmanager.model.AssetStatus;
import vn.doan.assetmanager.model.AssetType;
import vn.doan.assetmanager.model.AssignmentRecord;
import vn.doan.assetmanager.model.ComputerAsset;
import vn.doan.assetmanager.model.MaintenanceRecord;
import vn.doan.assetmanager.model.UserRole;
import vn.doan.assetmanager.repository.AppUserRepository;
import vn.doan.assetmanager.repository.AssetRepository;
import vn.doan.assetmanager.repository.AssignmentRepository;
import vn.doan.assetmanager.repository.MaintenanceRepository;

@Configuration
public class DataInitializer {
    private static final String LEGACY_DEMO_PASSWORD_HASH =
            "$2a$10$wK1Gv8e0z3h4iZJ.H1XnNuH68t495KzV9k0.x3tC6jYd5dJ7f9Fte";

    @Bean
    CommandLineRunner initData(
            AppUserRepository users,
            AssetRepository assetRepository,
            AssignmentRepository assignmentRepository,
            MaintenanceRepository maintenanceRepository,
            vn.doan.assetmanager.repository.CustomerRepository customerRepository,
            vn.doan.assetmanager.repository.ProductReviewRepository reviewRepository,
            DataSource dataSource,
            PasswordEncoder passwordEncoder,
            @Value("classpath:db/migration/V4__seed_brand_inventory.sql") Resource brandInventorySeed,
            @Value("${security.admin.username:admin}") String username,
            @Value("${security.admin.password:123}") String password) {
        return args -> {
            AppUser admin = users.findByUsername(username).orElse(null);
            if (admin == null) {
                users.save(new AppUser(username, "Quản trị viên", passwordEncoder.encode(password), UserRole.ADMIN));
            } else if (LEGACY_DEMO_PASSWORD_HASH.equals(admin.getPasswordHash())) {
                admin.updatePasswordHash(passwordEncoder.encode(password));
                users.save(admin);
            }

            ensureDemoAccount(users, passwordEncoder, "cashier", "Nguyễn Thu Ngân", UserRole.CASHIER);
            // Remove the legacy duplicate cashier accounts from existing databases.
            users.findByUsername("cashier1").ifPresent(users::delete);
            users.findByUsername("cashier2").ifPresent(users::delete);
            ensureDemoAccount(users, passwordEncoder, "fixer", "Trần Minh Khang", UserRole.FIXER);

            // Seed the base examples for databases that do not run Flyway (the H2 profile).
            if (assetRepository.count() == 0) {
                ComputerAsset snack = new ComputerAsset(
                        "SNK-001", "SNACK-001", AssetType.SNACK, "Oishi", "Snack khoai tây vị phô mai",
                        "Snack giòn vị phô mai", 120, "Gói",
                        LocalDate.of(2026, 1, 1), null,
                        new BigDecimal("15000.00"), "Kệ đồ ăn vặt", "Giá bán 15.000 VNĐ | Hạn sử dụng in trên bao bì");
                assetRepository.save(snack);

                ComputerAsset cookie = new ComputerAsset(
                        "SNK-002", "SNACK-002", AssetType.SNACK, "Oreo", "Bánh quy kem Oreo",
                        "Bánh quy socola nhân kem vani", 90, "Gói",
                        LocalDate.of(2026, 1, 1), null,
                        new BigDecimal("18000.00"), "Kệ đồ ăn vặt", "Giá bán 18.000 VNĐ");
                assetRepository.save(cookie);

                ComputerAsset toyCar = new ComputerAsset(
                        "TOY-001", "TOY-001", AssetType.TOY, "ToyJoy", "Xe ô tô đồ chơi mini",
                        "Xe đồ chơi nhựa nhiều màu", 45, "Cái",
                        LocalDate.of(2026, 1, 1), null,
                        new BigDecimal("35000.00"), "Kệ đồ chơi", "Giá bán 35.000 VNĐ");
                assetRepository.save(toyCar);

                ComputerAsset teddy = new ComputerAsset(
                        "TOY-002", "TOY-002", AssetType.TOY, "Plushie", "Gấu bông mini",
                        "Gấu bông mềm kích thước nhỏ", 30, "Con",
                        LocalDate.of(2026, 1, 1), null,
                        new BigDecimal("65000.00"), "Kệ đồ chơi", "Giá bán 65.000 VNĐ");
                assetRepository.save(teddy);
            }

            if (!assetRepository.existsByAssetCodeStartingWith("SNK-")) {
                new ResourceDatabasePopulator(brandInventorySeed).execute(dataSource);
            }
            var initializedAssets = assetRepository.findAll().stream()
                    .filter(asset -> !asset.isInTrash())
                    .toList();
            assetRepository.flush();

            // Seed 15 khách hàng từ hạng Đồng đến Vàng
            if (customerRepository.count() == 0) {
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Hoàng Minh Đức", "0912345678", "duc.hoang@gmail.com", "Cầu Giấy, Hà Nội", "GOLD", new BigDecimal("1250000"), 6, LocalDate.of(2025, 2, 10)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Trần Thị Mai Anh", "0987654321", "maianh.tran@gmail.com", "Ba Đình, Hà Nội", "GOLD", new BigDecimal("985000"), 5, LocalDate.of(2025, 3, 15)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Lê Văn Hùng", "0903123456", "hung.le@techcorp.vn", "Quận 1, TP.HCM", "GOLD", new BigDecimal("850000"), 4, LocalDate.of(2025, 4, 1)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Phạm Thu Hà", "0938111222", "thuha.design@gmail.com", "Đống Đa, Hà Nội", "GOLD", new BigDecimal("760000"), 4, LocalDate.of(2025, 5, 20)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Nguyễn Tiến Đạt", "0979333444", "dat.nguyen@fpt.com", "Hải Châu, Đà Nẵng", "SILVER", new BigDecimal("450000"), 3, LocalDate.of(2025, 6, 12)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Đỗ Bích Ngọc", "0968555666", "ngoc.dobic@gmail.com", "Thanh Xuân, Hà Nội", "SILVER", new BigDecimal("380000"), 2, LocalDate.of(2025, 7, 8)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Vũ Hoàng Long", "0945777888", "long.vu@viettel.vn", "Bình Thạnh, TP.HCM", "SILVER", new BigDecimal("325000"), 2, LocalDate.of(2025, 8, 25)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Ngô Bảo Trâm", "0918999000", "tram.ngo@gmail.com", "Tây Hồ, Hà Nội", "SILVER", new BigDecimal("280000"), 2, LocalDate.of(2025, 9, 14)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Đặng Quang Huy", "0922334455", "huy.dang@gmail.com", "Ninh Kiều, Cần Thơ", "SILVER", new BigDecimal("240000"), 2, LocalDate.of(2025, 10, 5)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Bùi Tuấn Anh", "0933445566", "anh.bui@gmail.com", "Nam Từ Liêm, Hà Nội", "BRONZE", new BigDecimal("185000"), 1, LocalDate.of(2025, 11, 18)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Nguyễn Khánh Linh", "0944556677", "linh.nk@gmail.com", "Quận 7, TP.HCM", "BRONZE", new BigDecimal("140000"), 1, LocalDate.of(2025, 12, 1)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Trịnh Quốc Việt", "0955667788", "viet.tq@gmail.com", "Ngô Quyền, Hải Phòng", "BRONZE", new BigDecimal("112000"), 1, LocalDate.of(2026, 1, 10)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Đinh Hương Giang", "0966778899", "giang.dinh@outlook.com", "Long Biên, Hà Nội", "BRONZE", new BigDecimal("85000"), 1, LocalDate.of(2026, 2, 14)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Mai Văn Phúc", "0977889900", "phuc.mai@gmail.com", "Thủ Đức, TP.HCM", "BRONZE", new BigDecimal("52000"), 1, LocalDate.of(2026, 3, 2)));
                customerRepository.save(new vn.doan.assetmanager.model.Customer("Phan Thanh Thảo", "0988990011", "thao.phan@gmail.com", "Hoàng Mai, Hà Nội", "BRONZE", new BigDecimal("28000"), 1, LocalDate.of(2026, 3, 20)));
            }

            // Seed các đánh giá và bình luận mẫu
            if (reviewRepository.count() == 0) {
                reviewRepository.save(new vn.doan.assetmanager.model.ProductReview("Hoàng Minh Đức", "Snack khoai tây vị phô mai", 5, "Snack giòn, vị phô mai thơm và dễ ăn.", java.time.LocalDateTime.now().minusDays(1), "Cảm ơn bạn đã ủng hộ siêu thị ạ!"));
                reviewRepository.save(new vn.doan.assetmanager.model.ProductReview("Trần Thị Mai Anh", "Bánh quy kem Oreo", 5, "Bánh ngon, đóng gói đẹp, phù hợp ăn vặt.", java.time.LocalDateTime.now().minusDays(3), "Shop cảm ơn bạn, hẹn gặp lại ạ!"));
                reviewRepository.save(new vn.doan.assetmanager.model.ProductReview("Lê Văn Hùng", "Xe ô tô đồ chơi mini", 5, "Đồ chơi đẹp, màu sắc bắt mắt.", java.time.LocalDateTime.now().minusDays(5), "Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm!"));
                reviewRepository.save(new vn.doan.assetmanager.model.ProductReview("Khách vãng lai (Tuấn)", "Gấu bông mini", 4, "Gấu mềm, dễ thương, phù hợp làm quà tặng.", java.time.LocalDateTime.now().minusDays(7), "Shop cảm ơn đánh giá của bạn ạ!"));
            }
        };
    }

    private static void ensureDemoAccount(
            AppUserRepository users,
            PasswordEncoder passwordEncoder,
            String username,
            String displayName,
            UserRole role) {
        AppUser user = users.findByUsername(username).orElse(null);
        if (user == null) {
            users.save(new AppUser(username, displayName, passwordEncoder.encode("123"), role));
        } else if (LEGACY_DEMO_PASSWORD_HASH.equals(user.getPasswordHash())) {
            user.updatePasswordHash(passwordEncoder.encode("123"));
            users.save(user);
        }
    }
}
