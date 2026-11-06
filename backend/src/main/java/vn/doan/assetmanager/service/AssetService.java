package vn.doan.assetmanager.service;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.security.JwtService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;

@Service
public class AssetService {

    private final AssetRepository assets;
    private final AssignmentRepository assignments;

    public AssetService(AssetRepository assets, AssignmentRepository assignments) {
        this.assets = assets;
        this.assignments = assignments;
    }

    @Transactional(readOnly = true)
    public Page<AssetResponse> list(String search, AssetStatus status, String manufacturer, Pageable pageable) {
        Specification<ComputerAsset> specification = (root, query, builder) -> builder.conjunction();
        specification = specification.and((root, query, builder) -> builder.isFalse(root.get("inTrash")));
        if (search != null && !search.isBlank()) {
            String term = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("assetCode")), term),
                    builder.like(builder.lower(root.get("serialNumber")), term),
                    builder.like(builder.lower(root.get("manufacturer")), term),
                    builder.like(builder.lower(root.get("modelName")), term),
                    builder.like(builder.lower(root.get("assigneeName")), term),
                    builder.like(builder.lower(root.get("location")), term)));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("status"), status));
        }
        if (manufacturer != null && !manufacturer.isBlank()) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(builder.lower(root.get("manufacturer")), manufacturer.trim().toLowerCase(Locale.ROOT)));
        }
        return assets.findAll(specification, pageable).map(AssetResponse::from);
    }

    @Transactional(readOnly = true)
    public AssetResponse get(Long id) {
        return AssetResponse.from(findAsset(id));
    }

    @Transactional
    public AssetResponse create(AssetRequest request) {
        ComputerAsset asset = new ComputerAsset(request.assetCode(), request.serialNumber(),
                request.type(), request.manufacturer(), request.modelName(), request.processor(),
                request.memoryGb(), request.storage(), request.purchaseDate(), request.warrantyUntil(),
                request.purchaseCost(), request.location(), request.notes());
        applySpecs(asset, request);
        return AssetResponse.from(assets.save(asset));
    }

    @Transactional
    public AssetResponse update(Long id, AssetRequest request) {
        ComputerAsset asset = findAsset(id);
        asset.update(request.assetCode(), request.serialNumber(), request.type(), request.manufacturer(),
                request.modelName(), request.processor(), request.memoryGb(), request.storage(),
                request.purchaseDate(), request.warrantyUntil(), request.purchaseCost(), request.location(),
                request.notes());
        applySpecs(asset, request);
        return AssetResponse.from(asset);
    }

    private void applySpecs(ComputerAsset asset, AssetRequest request) {
        asset.setScreenSizeInch(request.screenSizeInch());
        asset.setRefreshRateHz(request.refreshRateHz());
        asset.setUsbPorts(request.usbPorts());
        asset.setHasHeadphoneJack(request.hasHeadphoneJack());
        asset.setHasDedicatedGraphics(request.hasDedicatedGraphics());
    }

    @Transactional
    public void retire(Long id) {
        ComputerAsset asset = findAsset(id);
        if (asset.getStatus() == AssetStatus.MAINTENANCE) {
            throw new ConflictException("Không thể ngừng kinh doanh sản phẩm đang chờ xử lý");
        }
        if (asset.getStatus() == AssetStatus.ASSIGNED) {
            assignments.findFirstByAsset_IdAndReturnedAtIsNullOrderByAssignedAtDesc(id)
                    .ifPresent(AssignmentRecord::close);
        }
        asset.setStatus(AssetStatus.RETIRED);
    }

    ComputerAsset findAsset(Long id) {
        return assets.findById(id).filter(asset -> !asset.isInTrash())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
    }
}
