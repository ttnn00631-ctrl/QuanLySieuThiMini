package vn.doan.assetmanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "customer_repair_requests")
public class CustomerRepairRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_account_id", nullable = false)
    private CustomerAccount customerAccount;

    @Column(name = "device_type", nullable = false, length = 40)
    private String deviceType;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(nullable = false, length = 1000)
    private String issue;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaintenanceStatus status = MaintenanceStatus.OPEN;

    protected CustomerRepairRequest() {
    }

    public CustomerRepairRequest(CustomerAccount customerAccount, String deviceType, String manufacturer,
            String modelName, String serialNumber, String issue) {
        this.customerAccount = customerAccount;
        this.deviceType = deviceType;
        this.manufacturer = manufacturer;
        this.modelName = modelName;
        this.serialNumber = serialNumber;
        this.issue = issue;
        this.openedAt = Instant.now();
    }

    public void close(String resolutionNote) {
        this.status = MaintenanceStatus.CLOSED;
        this.closedAt = Instant.now();
        this.resolutionNote = resolutionNote;
    }

    public Long getId() { return id; }
    public CustomerAccount getCustomerAccount() { return customerAccount; }
    public String getDeviceType() { return deviceType; }
    public String getManufacturer() { return manufacturer; }
    public String getModelName() { return modelName; }
    public String getSerialNumber() { return serialNumber; }
    public String getIssue() { return issue; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getClosedAt() { return closedAt; }
    public String getResolutionNote() { return resolutionNote; }
    public MaintenanceStatus getStatus() { return status; }
}
