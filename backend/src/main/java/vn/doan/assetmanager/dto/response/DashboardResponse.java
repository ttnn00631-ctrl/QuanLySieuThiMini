package vn.doan.assetmanager.dto.response;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

public record DashboardResponse(long total, long available, long assigned, long maintenance, long retired) {
}
