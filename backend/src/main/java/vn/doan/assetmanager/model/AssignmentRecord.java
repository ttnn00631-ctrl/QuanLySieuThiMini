package vn.doan.assetmanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "assignment_history")
public class AssignmentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private ComputerAsset asset;

    @Column(name = "assignee_name", nullable = false, length = 120)
    private String assigneeName;

    @Column(nullable = false, length = 120)
    private String location;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(length = 500)
    private String note;

    @Column(name = "return_note", length = 500)
    private String returnNote;

    protected AssignmentRecord() {
    }

    public AssignmentRecord(ComputerAsset asset, String assigneeName, String location, String note) {
        this.asset = asset;
        this.assigneeName = assigneeName;
        this.location = location;
        this.note = note;
        this.assignedAt = Instant.now();
    }

    public void close() { close(null); }
    public void close(String returnNote) {
        this.returnedAt = Instant.now();
        this.returnNote = returnNote;
    }
    public Long getId() { return id; }
    public String getAssigneeName() { return assigneeName; }
    public String getLocation() { return location; }
    public Instant getAssignedAt() { return assignedAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public String getNote() { return note; }
    public String getReturnNote() { return returnNote; }
}
