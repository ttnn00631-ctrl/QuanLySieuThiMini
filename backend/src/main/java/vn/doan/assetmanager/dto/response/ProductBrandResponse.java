package vn.doan.assetmanager.dto.response;

import vn.doan.assetmanager.model.ProductBrand;

public record ProductBrandResponse(Long id, String name) {
    public static ProductBrandResponse from(ProductBrand brand) {
        return new ProductBrandResponse(brand.getId(), brand.getName());
    }
}
