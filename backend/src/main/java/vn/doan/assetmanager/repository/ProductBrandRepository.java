package vn.doan.assetmanager.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.ProductBrand;

public interface ProductBrandRepository extends JpaRepository<ProductBrand, Long> {
    List<ProductBrand> findAllByInTrashFalseOrderByNameAsc();
    Optional<ProductBrand> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
