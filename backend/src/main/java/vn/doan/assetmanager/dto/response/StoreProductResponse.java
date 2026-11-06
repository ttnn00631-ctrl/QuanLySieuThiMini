package vn.doan.assetmanager.dto.response;

import java.math.BigDecimal;
import vn.doan.assetmanager.model.ComputerAsset;

public record StoreProductResponse(
        Long id,
        String assetCode,
        String type,
        String status,
        String manufacturer,
        String modelName,
        String imageUrl,
        String processor,
        Integer memoryGb,
        String storage,
        java.math.BigDecimal screenSizeInch,
        Integer refreshRateHz,
        String usbPorts,
        Boolean hasHeadphoneJack,
        Boolean hasDedicatedGraphics,
        BigDecimal price,
        int viewCount) {

    public static StoreProductResponse from(ComputerAsset asset) {
        return new StoreProductResponse(asset.getId(), asset.getAssetCode(), asset.getType().name(),
                asset.getStatus().name(),
                asset.getManufacturer(), asset.getModelName(), asset.getImageUrl(), asset.getProcessor(),
                asset.getMemoryGb(), asset.getStorage(), asset.getScreenSizeInch(), asset.getRefreshRateHz(),
                asset.getUsbPorts(), asset.getHasHeadphoneJack(), asset.getHasDedicatedGraphics(),
                asset.getPurchaseCost(), asset.getStoreViewCount());
    }
}
