package vn.doan.assetmanager.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.doan.assetmanager.dto.request.ProductBrandRequest;
import vn.doan.assetmanager.dto.response.ProductBrandResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.ProductBrand;
import vn.doan.assetmanager.repository.AssetRepository;
import vn.doan.assetmanager.repository.ProductBrandRepository;

@Service
public class ProductBrandService {

    private final ProductBrandRepository brands;
    private final AssetRepository assets;

    public ProductBrandService(ProductBrandRepository brands, AssetRepository assets) {
        this.brands = brands;
        this.assets = assets;
    }

    @Transactional
    public List<ProductBrandResponse> list() {
        assets.findAll().stream().map(asset -> asset.getManufacturer().trim())
                .filter(name -> !name.isEmpty())
                .distinct()
                .forEach(name -> brands.findByNameIgnoreCase(name).orElseGet(() -> brands.save(new ProductBrand(name))));
        return brands.findAllByInTrashFalseOrderByNameAsc().stream()
                .map(ProductBrandResponse::from).toList();
    }

    @Transactional
    public ProductBrandResponse create(ProductBrandRequest request) {
        String name = normalize(request.name());
        if (brands.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("Hãng sản phẩm đã tồn tại");
        }
        return ProductBrandResponse.from(brands.save(new ProductBrand(name)));
    }

    @Transactional
    public ProductBrandResponse update(Long id, ProductBrandRequest request) {
        ProductBrand brand = findById(id);
        if (brand.isInTrash()) throw new ConflictException("Không thể sửa hãng đang nằm trong thùng rác");
        String name = normalize(request.name());
        if (brands.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Hãng sản phẩm đã tồn tại");
        }
        String previousName = brand.getName();
        brand.setName(name);
        assets.renameManufacturer(previousName, name);
        return ProductBrandResponse.from(brand);
    }

    @Transactional
    public ProductBrand findById(Long id) {
        return brands.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy hãng sản phẩm"));
    }

    private String normalize(String name) {
        return name.trim();
    }
}
