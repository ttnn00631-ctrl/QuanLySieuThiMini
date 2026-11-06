package vn.doan.assetmanager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import vn.doan.assetmanager.dto.response.StoreProductResponse;
import vn.doan.assetmanager.model.*;

class ComputerAssetTest {

    @Test
    void assignmentAndReturnMoveAssetThroughExpectedStates() {
        ComputerAsset asset = new ComputerAsset("TOY-TEST-01", null, AssetType.TOY, "Oishi", "Snack khoai tây",
                null, null, null, null, null, BigDecimal.ZERO, "Kho", null);

        asset.assign("Nguyễn Minh An", "Phòng Kỹ thuật");

        assertEquals(AssetStatus.ASSIGNED, asset.getStatus());
        assertEquals("Nguyễn Minh An", asset.getAssigneeName());
        assertEquals("Phòng Kỹ thuật", asset.getLocation());

        asset.returnToInventory();

        assertEquals(AssetStatus.AVAILABLE, asset.getStatus());
        assertNull(asset.getAssigneeName());
    }

    @Test
    void retirementClearsCurrentAssignee() {
        ComputerAsset asset = new ComputerAsset("TOY-TEST-02", null, AssetType.TOY, "Oreo", "Gấu bông mini",
                null, null, null, null, null, null, "Phòng IT", null);
        asset.assign("Trần Hà My", "Phòng IT");

        asset.setStatus(AssetStatus.RETIRED);

        assertEquals(AssetStatus.RETIRED, asset.getStatus());
        assertNull(asset.getAssigneeName());
    }

    @Test
    void storeProductResponseIncludesImageUrlStoredOnAsset() {
        ComputerAsset asset = new ComputerAsset("STORE-01", null, AssetType.SNACK, "Oreo", "Bánh quy kem",
                null, 16, "512 GB SSD", null, null, new BigDecimal("1000"), "Kho", null);
        asset.setImageUrl("/snack.svg");

        StoreProductResponse response = StoreProductResponse.from(asset);

        assertEquals("/snack.svg", response.imageUrl());
    }
}