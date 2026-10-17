// d:\Luopan\anju_luopan-backendJava\anjuLuopan\src\main\java\com\anju\luopan\service\FavoriteService.java
package com.anju.luopan.service;

import java.util.List;

public interface FavoriteService {
    void addFavorite(Long userId, Long houseId);
    void removeFavorite(Long userId, Long houseId);
    List<Long> getFavoriteHouseIds(Long userId);
    boolean isFavorited(Long userId, Long houseId);
}