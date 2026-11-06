package vn.doan.assetmanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 20, unique = true)
    private String phone;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "membership_tier", nullable = false, length = 20)
    private String membershipTier; // BRONZE, SILVER, GOLD

    @Column(name = "total_spent", precision = 14, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "orders_count")
    private Integer ordersCount = 0;

    @Column(name = "joined_date")
    private LocalDate joinedDate;

    @Column(name = "in_trash", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean inTrash;

    public Customer() {}

    public Customer(String fullName, String phone, String email, String address, String membershipTier, BigDecimal totalSpent, Integer ordersCount, LocalDate joinedDate) {
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.membershipTier = membershipTier;
        this.totalSpent = totalSpent != null ? totalSpent : BigDecimal.ZERO;
        this.ordersCount = ordersCount != null ? ordersCount : 0;
        this.joinedDate = joinedDate != null ? joinedDate : LocalDate.now();
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getMembershipTier() { return membershipTier; }
    public void setMembershipTier(String membershipTier) { this.membershipTier = membershipTier; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
    public Integer getOrdersCount() { return ordersCount; }
    public void setOrdersCount(Integer ordersCount) { this.ordersCount = ordersCount; }
    public LocalDate getJoinedDate() { return joinedDate; }
    public void setJoinedDate(LocalDate joinedDate) { this.joinedDate = joinedDate; }
    public boolean isInTrash() { return inTrash; }
    public void setInTrash(boolean inTrash) { this.inTrash = inTrash; }
}
