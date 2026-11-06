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
@Table(name = "maintenance_records")
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private ComputerAsset asset;

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

    protected MaintenanceRecord() {
    }

    public MaintenanceRecord(ComputerAsset asset, String issue) {
        this.asset = asset;
        this.issue = issue;
        this.openedAt = Instant.now();
    }

    public void close(String resolutionNote) {
        this.status = MaintenanceStatus.CLOSED;
        this.closedAt = Instant.now();
        this.resolutionNote = resolutionNote;
    }

    public Long getId() { return id; }
    public ComputerAsset getAsset() { return asset; }
    public String getIssue() { return issue; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getClosedAt() { return closedAt; }
    public String getResolutionNote() { return resolutionNote; }
    public MaintenanceStatus getStatus() { return status; }
}
