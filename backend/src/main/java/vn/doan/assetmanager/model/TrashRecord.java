package vn.doan.assetmanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "trash_records")
public class TrashRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 255)
    private String label;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", nullable = false, length = 80)
    private String deletedBy;

    @Column(name = "original_enabled")
    private Boolean originalEnabled;

    protected TrashRecord() {
    }

    public TrashRecord(String itemType, Long entityId, String label, String summary,
            LocalDateTime deletedAt, String deletedBy, Boolean originalEnabled) {
        this.itemType = itemType;
        this.entityId = entityId;
        this.label = label;
        this.summary = summary;
        this.deletedAt = deletedAt;
        this.deletedBy = deletedBy;
        this.originalEnabled = originalEnabled;
    }

    public Long getId() { return id; }
    public String getItemType() { return itemType; }
    public Long getEntityId() { return entityId; }
    public String getLabel() { return label; }
    public String getSummary() { return summary; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public String getDeletedBy() { return deletedBy; }
    public Boolean getOriginalEnabled() { return originalEnabled; }
}
