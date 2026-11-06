package vn.doan.assetmanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "mini_mart_products", uniqueConstraints = {
        @UniqueConstraint(name = "uk_asset_code", columnNames = "asset_code")
})
public class ComputerAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_code", nullable = false, length = 40)
    private String assetCode;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetType type;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 300)
    private String processor;

    @Column(name = "memory_gb")
    private Integer memoryGb;

    @Column(length = 120)
    private String storage;

    @Column(name = "screen_size_inch", precision = 4, scale = 1)
    private BigDecimal screenSizeInch;

    @Column(name = "refresh_rate_hz")
    private Integer refreshRateHz;

    @Column(name = "usb_ports", length = 300)
    private String usbPorts;

    @Column(name = "has_headphone_jack")
    private Boolean hasHeadphoneJack;

    @Column(name = "has_dedicated_graphics")
    private Boolean hasDedicatedGraphics;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_until")
    private LocalDate warrantyUntil;

    @Column(name = "purchase_cost", precision = 14, scale = 2)
    private BigDecimal purchaseCost;

    @Column(nullable = false, length = 120)
    private String location;

    @Column(name = "assignee_name", length = 120)
    private String assigneeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetStatus status = AssetStatus.AVAILABLE;

    @Column(length = 1000)
    private String notes;

    @Column(name = "in_trash", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean inTrash;

    @Column(name = "store_view_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int storeViewCount;

    protected ComputerAsset() {
    }

    public ComputerAsset(String assetCode, String serialNumber, AssetType type, String manufacturer,
            String modelName, String processor, Integer memoryGb, String storage, LocalDate purchaseDate,
            LocalDate warrantyUntil, BigDecimal purchaseCost, String location, String notes) {
        this.assetCode = assetCode;
        this.serialNumber = serialNumber;
        this.type = type;
        this.manufacturer = manufacturer;
        this.modelName = modelName;
        this.processor = processor;
        this.memoryGb = memoryGb;
        this.storage = storage;
        this.purchaseDate = purchaseDate;
        this.warrantyUntil = warrantyUntil;
        this.purchaseCost = purchaseCost;
        this.location = location;
        this.notes = notes;
    }

    public void update(String assetCode, String serialNumber, AssetType type, String manufacturer,
            String modelName, String processor, Integer memoryGb, String storage, LocalDate purchaseDate,
            LocalDate warrantyUntil, BigDecimal purchaseCost, String location, String notes) {
        this.assetCode = assetCode;
        this.serialNumber = serialNumber;
        this.type = type;
        this.manufacturer = manufacturer;
        this.modelName = modelName;
        this.processor = processor;
        this.memoryGb = memoryGb;
        this.storage = storage;
        this.purchaseDate = purchaseDate;
        this.warrantyUntil = warrantyUntil;
        this.purchaseCost = purchaseCost;
        this.location = location;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public String getAssetCode() { return assetCode; }
    public String getSerialNumber() { return serialNumber; }
    public AssetType getType() { return type; }
    public String getManufacturer() { return manufacturer; }
    public String getModelName() { return modelName; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getProcessor() { return processor; }
    public Integer getMemoryGb() { return memoryGb; }
    public String getStorage() { return storage; }
    public BigDecimal getScreenSizeInch() { return screenSizeInch; }
    public void setScreenSizeInch(BigDecimal screenSizeInch) { this.screenSizeInch = screenSizeInch; }
    public Integer getRefreshRateHz() { return refreshRateHz; }
    public void setRefreshRateHz(Integer refreshRateHz) { this.refreshRateHz = refreshRateHz; }
    public String getUsbPorts() { return usbPorts; }
    public void setUsbPorts(String usbPorts) { this.usbPorts = usbPorts; }
    public Boolean getHasHeadphoneJack() { return hasHeadphoneJack; }
    public void setHasHeadphoneJack(Boolean hasHeadphoneJack) { this.hasHeadphoneJack = hasHeadphoneJack; }
    public Boolean getHasDedicatedGraphics() { return hasDedicatedGraphics; }
    public void setHasDedicatedGraphics(Boolean hasDedicatedGraphics) { this.hasDedicatedGraphics = hasDedicatedGraphics; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public LocalDate getWarrantyUntil() { return warrantyUntil; }
    public BigDecimal getPurchaseCost() { return purchaseCost; }
    public String getLocation() { return location; }
    public String getAssigneeName() { return assigneeName; }
    public AssetStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public boolean isInTrash() { return inTrash; }
    public void setInTrash(boolean inTrash) { this.inTrash = inTrash; }
    public int getStoreViewCount() { return storeViewCount; }

    public void assign(String assigneeName, String location) {
        this.assigneeName = assigneeName;
        this.location = location;
        this.status = AssetStatus.ASSIGNED;
    }

    public void returnToInventory() {
        this.assigneeName = null;
        this.status = AssetStatus.AVAILABLE;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
        if (status == AssetStatus.RETIRED) {
            this.assigneeName = null;
        }
    }

}
