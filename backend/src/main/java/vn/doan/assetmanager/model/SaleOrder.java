package vn.doan.assetmanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "sale_orders")
public class SaleOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, length = 50, unique = true)
    private String orderCode;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "fk_sale_order_customer"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Customer customer;

    @Column(name = "is_guest")
    private Boolean isGuest = false;

    @Column(name = "cashier_name", length = 120)
    private String cashierName;

    @Column(name = "subtotal", precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", precision = 14, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // CASH, BANK_TRANSFER, CARD

    @Column(name = "items_json", columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "in_trash", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean inTrash;

    @Column(name = "order_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'COMPLETED'")
    private String orderStatus = "COMPLETED";

    public SaleOrder() {}

    public SaleOrder(String orderCode, String customerName, String customerPhone, Boolean isGuest, String cashierName,
                     BigDecimal subtotal, BigDecimal discountAmount, BigDecimal totalAmount,
                     String paymentMethod, String itemsJson) {
        this.orderCode = orderCode;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.isGuest = isGuest != null ? isGuest : false;
        this.cashierName = cashierName;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.paymentMethod = paymentMethod;
        this.itemsJson = itemsJson;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getOrderCode() { return orderCode; }
    public String getCustomerName() { return customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public Long getCustomerId() { return customer == null ? null : customer.getId(); }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Boolean getIsGuest() { return isGuest; }
    public String getCashierName() { return cashierName; }
    public void setCashierName(String cashierName) { this.cashierName = cashierName; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getItemsJson() { return itemsJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isInTrash() { return inTrash; }
    public void setInTrash(boolean inTrash) { this.inTrash = inTrash; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
}
