package vn.doan.assetmanager.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.doan.assetmanager.dto.request.MaintenanceCloseRequest;
import vn.doan.assetmanager.dto.request.MaintenanceRequest;
import vn.doan.assetmanager.dto.response.MaintenanceResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.AssetStatus;
import vn.doan.assetmanager.model.ComputerAsset;
import vn.doan.assetmanager.model.MaintenanceRecord;
import vn.doan.assetmanager.model.MaintenanceStatus;
import vn.doan.assetmanager.repository.MaintenanceRepository;

@Service
public class MaintenanceService {

    private final AssetService assetService;
    private final MaintenanceRepository maintenance;

    public MaintenanceService(AssetService assetService, MaintenanceRepository maintenance) {
        this.assetService = assetService;
        this.maintenance = maintenance;
    }

    @Transactional
    public MaintenanceResponse open(Long assetId, MaintenanceRequest request) {
        ComputerAsset asset = assetService.findAsset(assetId);
        if (asset.getStatus() == AssetStatus.RETIRED
                || asset.getStatus() == AssetStatus.MAINTENANCE
                || asset.getStatus() == AssetStatus.SOLD) {
            throw new ConflictException("Sản phẩm không thể tạo thêm yêu cầu xử lý");
        }
        asset.setStatus(AssetStatus.MAINTENANCE);
        return MaintenanceResponse.from(maintenance.save(new MaintenanceRecord(asset, request.issue().trim())));
    }

    @Transactional
    public MaintenanceResponse close(long maintenanceId, MaintenanceCloseRequest request) {
        MaintenanceRecord record = maintenance.findById(maintenanceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu xử lý sản phẩm"));
        if (record.getAsset().isInTrash()) {
            throw new NotFoundException("Không tìm thấy yêu cầu xử lý sản phẩm");
        }
        if (record.getStatus() == MaintenanceStatus.CLOSED) {
            throw new ConflictException("Yêu cầu xử lý sản phẩm đã hoàn tất");
        }
        record.close(request.resolutionNote());
        ComputerAsset asset = record.getAsset();
        if (asset.getStatus() == AssetStatus.MAINTENANCE) {
            asset.setStatus(asset.getAssigneeName() == null ? AssetStatus.AVAILABLE : AssetStatus.ASSIGNED);
        }
        return MaintenanceResponse.from(record);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceResponse> history(Long assetId) {
        assetService.findAsset(assetId);
        return maintenance.findByAsset_IdOrderByOpenedAtDesc(assetId).stream()
                .map(MaintenanceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceResponse> openItems() {
        return maintenance.findAllByStatusAndAsset_InTrashFalseOrderByOpenedAtDesc(MaintenanceStatus.OPEN).stream()
                .map(MaintenanceResponse::from).toList();
    }
}
