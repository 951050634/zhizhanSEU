# firmware 占位说明

## 当前边界

本目录当前只承担“为硬件接入预留工程骨架”的职责，不声明任何驱动、音频上传、姿态融合或板级通信已经验证。实物 `ESP-SensairShuttle` 到手前，这里只保留模块划分、接口边界和后续联调位。

## 计划中的目录职责

- `main/`：未来放 `app_main`、系统初始化和状态机入口
- `components/`：未来按模块拆分 `audio_input`、`audio_output`、`imu_fusion`、`networking`、`ws_client`、`display_ui`
- `include/`：未来放公共接口头文件与消息结构声明

## 建议模块拆分

### `state_machine`

负责设备运行状态切换，至少覆盖：

- `standby`
- `active`
- `interaction`
- `sleep`

### `imu_fusion`

负责接入 `BMI270` 或后续姿态数据源，为唤醒与低功耗切换提供依据。

### `audio_input`

负责通过 `I2S` 采集麦克风输入，并为云端问答链路提供音频源。

### `ws_client`

负责把 `wake`、`select_exhibit`、`ask_question` 等事件发到网页侧，后续与 `docs/message-contract.md` 保持同一字段结构。

### `cloud_bridge`

负责对接火山方向的设备云端链路。当前阶段只明确它会输出结构化结果，不承诺实际已接通。

## 与现有文档的关系

- 协议字段以 [docs/message-contract.md](../docs/message-contract.md) 为准
- 工程推进顺序以 [工程落实步骤.md](../工程落实步骤.md) 为准
- 当前无板阶段的演示策略以 [docs/demo-script.md](../docs/demo-script.md) 为准

## 板子到手后的第一批动作

1. 按 `ESP-IDF v5.5.2` 建立真实工程
2. 验证串口、烧录与最小系统启动
3. 分别验证屏幕、麦克风、IMU、扬声器与网络
4. 用当前已经冻结的消息结构打通网页侧联调
5. 再接入真实云端语音链路

## 与 `.venv` 的关系

后续若要写 Python 辅助脚本，例如日志回放、串口抓取转换或演示数据生成，统一在仓库根目录激活 `.venv` 后执行，不允许混用系统 Python。

