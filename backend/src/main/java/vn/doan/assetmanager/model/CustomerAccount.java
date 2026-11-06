package vn.doan.assetmanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.OneToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "customer_accounts")
public class CustomerAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String username;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 120)
    private String email;

    @Column(length = 20, unique = true)
    private String phone;

    @Column(nullable = false)
    private boolean enabled = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", unique = true,
            foreignKey = @ForeignKey(name = "fk_customer_account_customer"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Customer customer;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected CustomerAccount() {
    }

    public CustomerAccount(String username, String displayName, String passwordHash) {
        this.username = username;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getPasswordHash() { return passwordHash; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public boolean isEnabled() { return enabled; }
    public Long getCustomerId() { return customer == null ? null : customer.getId(); }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void linkCustomer(Customer customer) {
        this.customer = customer;
    }

    public void updateProfile(String displayName, String email, String phone) {
        this.displayName = displayName;
        this.email = email;
        this.phone = phone;
    }

    public void updateAdmin(String displayName, String email, String phone, boolean enabled, String passwordHash) {
        updateProfile(displayName, email, phone);
        this.enabled = enabled;
        if (passwordHash != null) {
            this.passwordHash = passwordHash;
        }
    }
}
