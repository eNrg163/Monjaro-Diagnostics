# Журнал разработки Monjaro

## Постоянное правило: сборка и скачивание APK через Termux

После каждого изменения Android-приложения:
1. Сохранять **полные исходники** и версию в GitHub до сборки.
2. Запускать GitHub Actions из Termux через `gh workflow run`.
3. Показывать ход сборки через `gh run watch --exit-status`.
4. **Только после успешной сборки** автоматически скачивать APK через `gh run download` в `~/storage/downloads/` с понятным названием и версией. Не заставлять пользователя искать APK в браузере.
5. При ошибке не выдавать APK за успешно собранный; показать лог `gh run view --log-failed`.
6. После установки тестировать на устройстве. Не удалять старые рабочие исходники и сборки.

### Monjaro GPS Reference 2.1: запуск, наблюдение, скачивание

Для Termux (после `gh auth login` и `termux-setup-storage`):

```bash
REPO="eNrg163/Monjaro-Diagnostics"; WF="build-gps-reference.yml"; gh workflow run "$WF" -R "$REPO" && sleep 5 && RUN_ID=$(gh run list -R "$REPO" --workflow "$WF" --event workflow_dispatch --limit 1 --json databaseId --jq '.[0].databaseId') && test -n "$RUN_ID" && echo "Сборка: $RUN_ID" && gh run watch "$RUN_ID" -R "$REPO" --exit-status && mkdir -p ~/monjaro_gps_v21 ~/storage/downloads && gh run download "$RUN_ID" -R "$REPO" -n Monjaro-GPS-Reference-debug -D ~/monjaro_gps_v21 && cp ~/monjaro_gps_v21/app-debug.apk ~/storage/downloads/Monjaro_GPS_Reference_v2.1.apk && echo "APK: ~/storage/downloads/Monjaro_GPS_Reference_v2.1.apk"
```

> Примечание: если параллельно запущены другие ручные сборки этого же workflow, выбирать ID нужного запуска по времени и автору; команда выше берёт самый свежий ручной запуск.

### Пример: Monjaro DIAG

`gh workflow run build-odometerdiag-recovery.yml -R eNrg163/Monjaro-Diagnostics` → `gh run watch` → `gh run download`.
