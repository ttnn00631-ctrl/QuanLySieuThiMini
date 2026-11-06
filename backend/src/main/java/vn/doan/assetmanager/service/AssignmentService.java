package vn.doan.assetmanager.service;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.security.JwtService;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignmentService {

    private final AssetService assetService;
    private final AssignmentRepository assignments;

    public AssignmentService(AssetService assetService, AssignmentRepository assignments) {
        this.assetService = assetService;
        this.assignments = assignments;
    }

    @Transactional
    public AssetResponse assign(Long assetId, AssignmentRequest request) {
        ComputerAsset asset = assetService.findAsset(assetId);
        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new ConflictException("Chỉ có thể xuất hàng khi sản phẩm còn trong kho");
        }
        asset.assign(request.assigneeName().trim(), request.location().trim());
        assignments.save(new AssignmentRecord(asset, request.assigneeName().trim(), request.location().trim(),
                request.note()));
        return AssetResponse.from(asset);
    }

    @Transactional
    public AssetResponse returnAsset(Long assetId, String note) {
        ComputerAsset asset = assetService.findAsset(assetId);
        if (asset.getStatus() != AssetStatus.ASSIGNED) {
            throw new ConflictException("Sản phẩm này hiện không thể xuất kho");
        }
        AssignmentRecord assignment = assignments
                .findFirstByAsset_IdAndReturnedAtIsNullOrderByAssignedAtDesc(assetId)
                .orElseThrow(() -> new ConflictException("Không tìm thấy lịch sử xuất hàng đang mở"));
        assignment.close(note);
        asset.returnToInventory();
        return AssetResponse.from(asset);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> history(Long assetId) {
        assetService.findAsset(assetId);
        return assignments.findByAsset_IdOrderByAssignedAtDesc(assetId).stream()
                .map(AssignmentResponse::from).toList();
    }
}
