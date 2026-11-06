package vn.doan.assetmanager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import vn.doan.assetmanager.model.*;

class MaintenanceRecordTest {

    @Test
    void closingTicketStoresResolutionAndTimestamp() {
        ComputerAsset asset = new ComputerAsset("TOY-TEST-03", null, AssetType.TOY, "ToyJoy", "Gấu bông mini",
                null, null, null, null, null, BigDecimal.ZERO, "Kho", null);
        MaintenanceRecord record = new MaintenanceRecord(asset, "Thay quạt tản nhiệt");

        record.close("Đã thay quạt mới");

        assertEquals(MaintenanceStatus.CLOSED, record.getStatus());
        assertEquals("Đã thay quạt mới", record.getResolutionNote());
        assertNotNull(record.getClosedAt());
    }
}