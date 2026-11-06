package vn.doan.assetmanager.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.doan.assetmanager.dto.response.TrashRecordResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.AppUser;
import vn.doan.assetmanager.model.ComputerAsset;
import vn.doan.assetmanager.model.Customer;
import vn.doan.assetmanager.model.SaleOrder;
import vn.doan.assetmanager.model.ProductBrand;
import vn.doan.assetmanager.model.TrashRecord;
import vn.doan.assetmanager.model.UserRole;
import vn.doan.assetmanager.repository.AppUserRepository;
import vn.doan.assetmanager.repository.AssetRepository;
import vn.doan.assetmanager.repository.AssignmentRepository;
import vn.doan.assetmanager.repository.CustomerRepository;
import vn.doan.assetmanager.repository.MaintenanceRepository;
import vn.doan.assetmanager.repository.SaleOrderRepository;
import vn.doan.assetmanager.repository.TrashRecordRepository;
import vn.doan.assetmanager.repository.ProductBrandRepository;

@Service
public class TrashService {

    private final AssetRepository assets;
    private final AssignmentRepository assignments;
    private final MaintenanceRepository maintenance;
    private final CustomerRepository customers;
    private final AppUserRepository users;
    private final SaleOrderRepository orders;
    private final TrashRecordRepository trash;
    private final ProductBrandRepository brands;

    public TrashService(AssetRepository assets, AssignmentRepository assignments,
            MaintenanceRepository maintenance, CustomerRepository customers,
            AppUserRepository users, SaleOrderRepository orders, TrashRecordRepository trash,
            ProductBrandRepository brands) {
        this.assets = assets;
        this.assignments = assignments;
        this.maintenance = maintenance;
        this.customers = customers;
        this.users = users;
        this.orders = orders;
        this.trash = trash;
        this.brands = brands;
    }

    @Transactional(readOnly = true)
    public List<TrashRecordResponse> list() {
        return trash.findAllByOrderByDeletedAtDesc().stream().map(TrashRecordResponse::from).toList();
    }

    @Transactional
    public TrashRecordResponse moveToTrash(String rawType, Long id, String actingUsername) {
        String type = normalizeType(rawType);
        if (trash.findFirstByItemTypeAndEntityId(type, id).isPresent()) {
            throw new ConflictException("Bản ghi này đã nằm trong thùng rác");
        }
        String label;
        String summary;
        Boolean originalEnabled = null;

        switch (type) {
            case "ASSET" -> {
                ComputerAsset asset = assets.findById(id)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
                if (asset.isInTrash()) throw new ConflictException("Sản phẩm đã nằm trong thùng rác");
                asset.setInTrash(true);
                label = asset.getAssetCode();
                summary = asset.getManufacturer() + " " + asset.getModelName() + " · " + asset.getStatus();
            }
            case "CUSTOMER" -> {
                Customer customer = customers.findById(id)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy khách hàng"));
                if (customer.isInTrash()) throw new ConflictException("Khách hàng đã nằm trong thùng rác");
                customer.setInTrash(true);
                label = customer.getFullName();
                summary = customer.getPhone() + " · Hạng " + customer.getMembershipTier();
            }
            case "USER" -> {
                AppUser user = users.findById(id)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
                if (user.isInTrash()) throw new ConflictException("Tài khoản đã nằm trong thùng rác");
                if (user.getUsername().equals(actingUsername)) {
                    throw new AccessDeniedException("Không thể chuyển tài khoản đang đăng nhập vào thùng rác");
                }
                if (user.getRole() == UserRole.ADMIN && user.isEnabled()
                        && users.countByRoleAndEnabledTrue(UserRole.ADMIN) <= 1) {
                    throw new ConflictException("Không thể chuyển quản trị viên hoạt động cuối cùng vào thùng rác");
                }
                originalEnabled = user.isEnabled();
                user.setEnabled(false);
                user.setInTrash(true);
                label = user.getDisplayName();
                summary = "@" + user.getUsername() + " · " + user.getRole();
            }
            case "ORDER" -> {
                SaleOrder order = orders.findById(id)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
                if (order.isInTrash()) throw new ConflictException("Hóa đơn đã nằm trong thùng rác");
                order.setInTrash(true);
                label = order.getOrderCode();
                summary = order.getCustomerName() + " · " + order.getTotalAmount();
            }
            case "BRAND" -> {
                ProductBrand brand = brands.findById(id)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy hãng sản phẩm"));
                if (brand.isInTrash()) throw new ConflictException("Hãng đã nằm trong thùng rác");
                brand.setInTrash(true);
                label = brand.getName();
                summary = "Hãng sản phẩm · Các sản phẩm hiện có được giữ nguyên";
            }
            default -> throw new ConflictException("Loại dữ liệu không hỗ trợ");
        }

        TrashRecord record = trash.save(new TrashRecord(type, id, label, summary,
                LocalDateTime.now(), actingUsername, originalEnabled));
        return TrashRecordResponse.from(record);
    }

    @Transactional
    public void restore(Long trashId) {
        TrashRecord record = findRecord(trashId);
        switch (record.getItemType()) {
            case "ASSET" -> assets.findById(record.getEntityId())
                    .orElseThrow(() -> new NotFoundException("Sản phẩm gốc không còn tồn tại"))
                    .setInTrash(false);
            case "CUSTOMER" -> customers.findById(record.getEntityId())
                    .orElseThrow(() -> new NotFoundException("Khách hàng gốc không còn tồn tại"))
                    .setInTrash(false);
            case "USER" -> {
                AppUser user = users.findById(record.getEntityId())
                        .orElseThrow(() -> new NotFoundException("Tài khoản gốc không còn tồn tại"));
                user.setInTrash(false);
                user.setEnabled(Boolean.TRUE.equals(record.getOriginalEnabled()));
            }
            case "ORDER" -> orders.findById(record.getEntityId())
                    .orElseThrow(() -> new NotFoundException("Hóa đơn gốc không còn tồn tại"))
                    .setInTrash(false);
            case "BRAND" -> {
                ProductBrand brand = brands.findById(record.getEntityId())
                        .orElseThrow(() -> new NotFoundException("Hãng gốc không còn tồn tại"));
                if (brands.findAllByInTrashFalseOrderByNameAsc().stream()
                        .anyMatch(active -> active.getName().equalsIgnoreCase(brand.getName()))) {
                    throw new ConflictException("Đã có hãng cùng tên; hãy đổi tên hãng trước khi khôi phục");
                }
                brand.setInTrash(false);
            }
            default -> throw new ConflictException("Loại dữ liệu thùng rác không hợp lệ");
        }
        trash.delete(record);
    }

    @Transactional
    public void deletePermanently(Long trashId) {
        TrashRecord record = findRecord(trashId);
        switch (record.getItemType()) {
            case "ASSET" -> {
                assignments.deleteByAsset_Id(record.getEntityId());
                maintenance.deleteByAsset_Id(record.getEntityId());
                assets.deleteById(record.getEntityId());
            }
            case "CUSTOMER" -> customers.deleteById(record.getEntityId());
            case "USER" -> users.deleteById(record.getEntityId());
            case "ORDER" -> orders.deleteById(record.getEntityId());
            case "BRAND" -> {
                ProductBrand brand = brands.findById(record.getEntityId())
                        .orElseThrow(() -> new NotFoundException("Hãng gốc không còn tồn tại"));
                if (assets.existsByManufacturerIgnoreCase(brand.getName())) {
                    throw new ConflictException("Không thể xóa vĩnh viễn hãng khi vẫn còn sản phẩm đang sử dụng hãng này");
                }
                brands.delete(brand);
            }
            default -> throw new ConflictException("Loại dữ liệu thùng rác không hợp lệ");
        }
        trash.delete(record);
    }

    private TrashRecord findRecord(Long id) {
        return trash.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy mục trong thùng rác"));
    }

    private String normalizeType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase();
        if (!List.of("ASSET", "CUSTOMER", "USER", "ORDER", "BRAND").contains(normalized)) {
            throw new ConflictException("Loại dữ liệu không hỗ trợ");
        }
        return normalized;
    }
}
