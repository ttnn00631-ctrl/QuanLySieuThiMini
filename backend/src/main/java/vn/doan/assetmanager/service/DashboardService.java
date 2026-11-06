package vn.doan.assetmanager.service;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.security.JwtService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final AssetRepository assets;

    public DashboardService(AssetRepository assets) {
        this.assets = assets;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        long available = assets.countByStatusAndInTrashFalse(AssetStatus.AVAILABLE);
        long assigned = assets.countByStatusAndInTrashFalse(AssetStatus.ASSIGNED);
        long maintenance = assets.countByStatusAndInTrashFalse(AssetStatus.MAINTENANCE);
        long retired = assets.countByStatusAndInTrashFalse(AssetStatus.RETIRED);
        return new DashboardResponse(available + assigned + maintenance + retired,
                available, assigned, maintenance, retired);
    }
}
