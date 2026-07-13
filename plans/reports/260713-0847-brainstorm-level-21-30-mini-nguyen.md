# Brainstorm: Level 21-30 + Mini Nguyên / Mini Black Nguyên

## Problem statement
User ban đầu nói level 31-40 nhưng thực ra là level 21-30 (đã confirm). Codebase hiện chỉ có level 1-20 (`LEVEL_COUNT=20`); level 21-30 chưa tồn tại. Cần: level 21-30 layout giống 1-10, boss giống 11-20 (Black Nguyên/Khôi/Father), cộng thêm 2 cơ chế mới:
- Mini Nguyên: đồng minh bay theo player, 20 HP, không hồi, tỏa hào quang, scale 0.5, bắn 1 đạn/2s.
- Mini Black Nguyên: phụ boss, 10 HP, bắn 1 đạn/2s, đi kèm mọi boss chính trong 21-30.

## Requirements (confirmed qua AskUserQuestion)
1. Level 21-30: `LEVEL_COUNT` 20→30, layout tự lặp 1-10 (cơ chế có sẵn), boss sequence mirror 11-20.
2. Mini Nguyên trigger: tự động có từ đầu level 21-30 (không qua pickup).
3. Mini Nguyên bay theo player — y luôn = player.y, không physics/landing riêng, không bị chặn bởi block.
4. Run phase: Mini Nguyên bắn liên tục (mỗi 2s), đạn phá được obstacle (tái dùng player projectile pipeline). Va chạm obstacle (spike/block) trừ máu Mini Nguyên.
5. Boss phase: Mini Nguyên tự chuyển ra đứng trước player, chắn đạn boss — đạn chạm nó trừ máu nó trước, hết máu mới tới lượt player bị trừ heart. Mini Nguyên tự bắn đạn (2s/viên) cộng dồn vào damage boss.
6. Mini Nguyên hết máu → biến mất hẳn (không respawn trong level đó).
7. Mini Black Nguyên: HP riêng = 10, bắn mỗi 2s, spawn cùng MỌI boss chính (nguyen/khoi/father, kể cả big variants) trong chuỗi 21-30. Player phải bắn hạ nó song song với boss chính (mục tiêu phụ độc lập, không tự chết theo boss chính).

## Approach đã chọn (không có alternative nào được cân nhắc nghiêm túc — mechanics đã rất cụ thể từ user, chỉ có 1 cách hợp lý theo KISS)

### Data layer
- `js/level-data.js`: `LEVEL_COUNT` 20→30. Thêm flag `hasMiniNguyen` cho level object (number >= 21 && <= 30).
- `js/boss-level-data.js`: thêm `BOSS_SEQUENCES` 21-30, mirror 11-20 y hệt (offset +10).

### Mini Nguyên (đồng minh)
- File mới `js/mini-companion-state.js`: class `MiniCompanion` — state {hp, alive, fireTimer, x, y}, method `update(dt, player, phase)` set x offset theo phase (run: `player.x - 0.8`; boss: `player.x + 0.5`), y = player.y luôn. `takeDamage(n)`, `tryFire()` trả bullet spawn request mỗi 2s.
- Run phase (GameState.update): mini bullet đẩy vào `this.projectiles` chung (tái dùng `updateProjectiles`/`findProjectileHit` — không code collision mới). Damage từ obstacle: export 1 hàm overlap-check nhỏ từ `collision-detection.js` (tách phần hitbox-tuning dùng chung, không mutate/landing) để check Mini Nguyên vs obstacles mỗi frame.
- Boss phase (`boss-fight-state.js`): `updateBullets` check bullet-vs-MiniNguyên hitbox TRƯỚC bullet-vs-player; hit thì trừ máu Mini Nguyên thay vì player. Mini Nguyên fire timer đẩy bullet vào `playerBullets` chung (tái dùng damage-boss logic).

### Mini Black Nguyên (phụ boss)
- `BossFight.spawnNext()`: cùng lúc spawn main boss, spawn thêm `this.miniAdd = { hp:10, fireInterval:2.0, scale:0.5, avatar:'nguyen', x: boss.x - offset, ... }`.
- `updateBullets`: player bullet check hit miniAdd (nếu còn sống) trước, rồi mới tới boss chính. `updateBoss`-style fire timer riêng cho miniAdd đẩy bullet vào `bossBullets` chung.
- Render: tái dùng `drawBoss()` có sẵn (avatar dark-tint, scale param đã hỗ trợ) — không cần asset mới.

### Rendering & HUD
- `boss-renderer.js`: thêm `drawCompanion()` cho Mini Nguyên — không dark-tint, có pulsing halo (tái dùng style từ shield aura trong `player-cube.js`).
- `hud-progress.js`: thêm label HP Mini Nguyên (luôn hiện ở level 21-30 khi còn sống) + label HP Mini Black Nguyên (hiện khi trong boss phase).

## Module hóa (CLAUDE.md: file <200 dòng)
- `js/mini-companion-state.js` mới (~90-110 dòng).
- `boss-fight-state.js` +~35 dòng (miniAdd logic) — vẫn <200.
- `collision-detection.js` thêm export overlap helper nhỏ, dùng chung cho player + Mini Nguyên (DRY, tránh lệch tuning nếu sửa sau).

## Risk / lưu ý
- Mini Nguyên bay xuyên block về mặt hình ảnh (không landing) — user đã xác nhận chấp nhận được ("Mini Nguyên có thể bay theo player").
- Cân bằng độ khó: mọi boss 21-30 giờ có thêm 1 nguồn đạn (Mini Black Nguyên) — có thể tăng độ khó đáng kể so với 11-20; nếu playtest thấy quá khó, cân nhắc giảm fireInterval hoặc tắt miniAdd cho các trận đơn (chỉ 1 boss) — để lại cho phase playtest/tuning trong plan, không quyết định trước.

## Next steps
- Handoff sang `/ck:plan` để viết plan chi tiết theo phase (data → mini companion state → boss integration → rendering/HUD → playtest).

## Unresolved questions
- Không có (tất cả đã confirm qua AskUserQuestion).
