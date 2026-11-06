package vn.doan.assetmanager.repository;

import vn.doan.assetmanager.model.*;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<ComputerAsset, Long>, JpaSpecificationExecutor<ComputerAsset> {
	long countByStatus(AssetStatus status);
	long countByStatusAndInTrashFalse(AssetStatus status);
	java.util.List<ComputerAsset> findByStatusAndInTrashFalse(AssetStatus status);
	java.util.List<ComputerAsset> findByInTrashFalse();
	void deleteById(Long id);
	boolean existsByAssetCodeStartingWith(String prefix);
	boolean existsByManufacturerIgnoreCase(String manufacturer);
	@Modifying
	@Query("update ComputerAsset asset set asset.storeViewCount = asset.storeViewCount + 1 "
			+ "where asset.id = :id and asset.status = :status and asset.inTrash = false "
			+ "and asset.purchaseCost is not null and asset.purchaseCost > 0")
	int incrementStoreViewCount(@Param("id") Long id, @Param("status") AssetStatus status);
	@Modifying
	@Query("update ComputerAsset asset set asset.manufacturer = :newName where lower(asset.manufacturer) = lower(:oldName)")
	int renameManufacturer(@Param("oldName") String oldName, @Param("newName") String newName);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select asset from ComputerAsset asset where asset.id = :id and asset.inTrash = false")
	Optional<ComputerAsset> findByIdForUpdate(@Param("id") Long id);
}
