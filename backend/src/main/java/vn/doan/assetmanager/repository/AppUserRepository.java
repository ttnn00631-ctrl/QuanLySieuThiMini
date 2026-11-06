package vn.doan.assetmanager.repository;

import vn.doan.assetmanager.model.*;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByIdAndInTrashFalse(Long id);
    boolean existsByUsername(String username);
    List<AppUser> findAllByInTrashFalseOrderByDisplayNameAsc();
    long countByRoleAndEnabledTrue(UserRole role);
}
