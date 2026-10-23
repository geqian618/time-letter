; ---------- 数据文件夹：覆盖安装选项页 + 卸载选项页 ----------
;
; 指针文件 $INSTDIR\config\config.ini 由主进程（electron/main.js 的 writeDataDirPointer）
; 写入，[Data] 段的 Dir 为用户自定义数据文件夹的完整路径（UTF-16LE + BOM，供 ReadINIStr 读取）。
; 注意：默认 userData 目录名取自 package.json 的 productName（时光信笺），两者需保持一致。
;
; 行为约定（不区分默认路径与自定义路径，统一处理）：
;   覆盖安装 —— 数据选项页：勾选「覆盖旧的数据文件夹」才删除，缺省不勾选（保留）；
;               保留时同时保留安装目录下的 data 与 config（config 存放设置与窗口状态）；
;               选择经注册表 OverwriteData 传递给静默执行的旧卸载器
;   卸载     —— 数据文件夹选项页：勾选「同时删除数据文件夹」缺省选中（删除），
;               取消勾选则保留
;
; 版本过渡说明：早于本脚本的安装包，其卸载器没有自定义钩子，覆盖安装/卸载时
; 走 electron-builder 默认整目录删除逻辑，data 会被清除——属一次性过渡，无需处理。
;
; 编译环境注意：
;   本文件被 electron-builder include 在脚本序言区（早于 MUI2 与语言文件加载），
;   因此 LangString 使用数字语言 ID（2052/1033），且需自行引入 LogicLib/MUI2/nsDialogs/FileFunc。
;   打包分两遍编译：安装器遍与卸载器构建遍（BUILD_UNINSTALLER）互不声明对方侧
;   的页面 / 函数 / 变量，未隔离干净会触发 NSIS 警告（6010/6020/6001/6040）。
;   安装器语言已由 electron-builder.json 的 installerLanguages 限制为 zh_CN / en_US。
!include "LogicLib.nsh"
!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "FileFunc.nsh"

; 指针文件读出的自定义数据文件夹路径：安装器页与卸载页都使用，两遍均声明
Var customDataDirPath

; 卸载器构建遍（BUILD_UNINSTALLER）专用：安装器遍不使用这些变量，避免未引用警告 6001
!ifdef BUILD_UNINSTALLER
Var deleteDataFlag       ; 数据文件夹删除判定："1"=删除（卸载流程缺省），"0"=保留（覆盖安装流程缺省）
Var hDeleteDataCheckbox  ; 卸载页勾选框句柄
Var updatedFlow          ; 是否由安装器静默调用（命令行带 --updated），供注册表清理判断
!endif

; 覆盖安装侧（安装器专有）变量与页面：卸载器构建遍不编译，
; 避免未引用变量 / 函数警告 6001 / 6010
!ifndef BUILD_UNINSTALLER
Var hOverwriteCheckbox   ; 覆盖安装页勾选框句柄
!endif

; 本文件被 include 在脚本序言区（早于 MUI2 页面与语言文件加载），
; 因此 LangString 使用数字语言 ID（2052=简体中文，1033=英语），不能用 ${LANG_*}
LangString dataOptionTitle 2052 "数据选项"
LangString dataOptionTitle 1033 "Data Options"
LangString dataOptionDesc 2052 "勾选后，安装时将删除旧的数据文件夹并重新创建；缺省保留。"
LangString dataOptionDesc 1033 "When checked, the old data folder (settings, thumbnails, etc.) will be deleted and recreated during installation. Unchecked means keep it."
LangString overwriteDataCheckbox 2052 "覆盖旧的配置与数据"
LangString overwriteDataCheckbox 1033 "Overwrite the old data folder (settings, thumbnails, etc.)"
LangString dataFolderTitle 2052 "数据文件夹"
LangString dataFolderTitle 1033 "Data Folder"
LangString dataFolderDesc 2052 "勾选后，卸载时同时删除数据文件夹；缺省选中。"
LangString dataFolderDesc 1033 "When checked, the data folder (settings, thumbnails, etc.) is deleted on uninstall. Checked by default."
LangString dataDirPathLabel 2052 "数据目录："
LangString dataDirPathLabel 1033 "Data directory: "
LangString deleteDataCheckbox 2052 "同时删除配置与数据"
LangString deleteDataCheckbox 1033 "Also delete the data folder (settings, thumbnails, etc.)"

; 读取指针（config.ini 的 [Data] Dir），结果存 $customDataDirPath（无指针时为空串）
!macro ReadDataDirPointer
  ReadINIStr $customDataDirPath "$INSTDIR\config\config.ini" "Data" "Dir"
!macroend

; 覆盖安装侧（安装器专有）：仅在实际打包安装器时编译。
; 卸载器构建遍（BUILD_UNINSTALLER）不声明安装器页面，避免函数未引用警告 6010
!ifndef BUILD_UNINSTALLER
Function ReadPointerFile
  !insertmacro ReadDataDirPointer
FunctionEnd

; 覆盖安装：数据选项页（选目录之后、安装执行之前；
; 指针文件与 $INSTDIR\data 均不存在时自动跳过，即全新安装场景）
Function DataOverwritePageCreate
  Call ReadPointerFile
  StrCmp $customDataDirPath "" 0 page_show
  IfFileExists "$INSTDIR\data\*.*" page_show page_skip
page_show:
  !insertmacro MUI_HEADER_TEXT "$(dataOptionTitle)" ""
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0u 100% 20u "$(dataOptionDesc)"
  Pop $0
  ; 自定义数据目录存在时展示其路径，便于用户知情决策
  StrCmp $customDataDirPath "" ow_no_custom
    ${NSD_CreateLabel} 0 24u 100% 12u "$(dataDirPathLabel)$customDataDirPath"
    Pop $0
    ${NSD_CreateCheckbox} 10u 42u 100% 12u "$(overwriteDataCheckbox)"
    Goto ow_checkbox_done
  ow_no_custom:
    ${NSD_CreateCheckbox} 10u 28u 100% 12u "$(overwriteDataCheckbox)"
  ow_checkbox_done:
  Pop $hOverwriteCheckbox
  nsDialogs::Show
page_skip:
  Abort
FunctionEnd

Function DataOverwritePageLeave
  ${NSD_GetState} $hOverwriteCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    WriteRegStr HKCU "Software\时光信笺" "OverwriteData" "1"
  ${Else}
    WriteRegStr HKCU "Software\时光信笺" "OverwriteData" "0"
  ${EndIf}
FunctionEnd

!macro customPageAfterChangeDir
  Page custom DataOverwritePageCreate DataOverwritePageLeave
!macroend
!endif

; 卸载侧（卸载器专有）：仅在卸载器构建遍（BUILD_UNINSTALLER）编译。
; 安装器遍不引入 uninstaller.nsh、无 WriteUninstaller，若存在卸载函数会触发 6020 警告
!ifdef BUILD_UNINSTALLER
Function un.ReadPointerFile
  !insertmacro ReadDataDirPointer
FunctionEnd

; 卸载：数据文件夹选项页（指针文件与 $INSTDIR\data 均不存在时自动跳过）
Function un.DataFolderPageCreate
  Call un.ReadPointerFile
  StrCmp $customDataDirPath "" 0 page_show
  IfFileExists "$INSTDIR\data\*.*" page_show page_skip
page_show:
  !insertmacro MUI_HEADER_TEXT "$(dataFolderTitle)" ""
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0u 100% 20u "$(dataFolderDesc)"
  Pop $0
  ; 自定义数据目录存在时展示其路径，便于用户知情决策
  StrCmp $customDataDirPath "" un_no_custom
    ${NSD_CreateLabel} 0 24u 100% 12u "$(dataDirPathLabel)$customDataDirPath"
    Pop $0
    ${NSD_CreateCheckbox} 10u 42u 100% 12u "$(deleteDataCheckbox)"
    Goto un_checkbox_done
  un_no_custom:
    ${NSD_CreateCheckbox} 10u 28u 100% 12u "$(deleteDataCheckbox)"
  un_checkbox_done:
  Pop $hDeleteDataCheckbox
  ${NSD_Check} $hDeleteDataCheckbox ; 缺省选中：删除
  nsDialogs::Show
page_skip:
  Abort
FunctionEnd

Function un.DataFolderPageLeave
  ${NSD_GetState} $hDeleteDataCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $deleteDataFlag "1"
  ${Else}
    StrCpy $deleteDataFlag "0"
  ${EndIf}
FunctionEnd

!macro customUnInit
  ; 卸载流程缺省删除（与选项页缺省选中一致）；选项页取消勾选时覆盖为 "0"
  StrCpy $deleteDataFlag "1"
!macroend

!macro customUnWelcomePage
  !insertmacro MUI_UNPAGE_WELCOME
  UninstPage custom un.DataFolderPageCreate un.DataFolderPageLeave
!macroend

; 解析数据删除判定到指定变量：
;   覆盖安装（安装器静默调用旧卸载器，命令行带 --updated）→ 读安装页写入的 OverwriteData，
;     缺省 "0"=保留（选项页缺省不勾选）
;   手动卸载 → $deleteDataFlag（选项页勾选，缺省 "1"=删除）
; 注意：不在此处清理注册表值——customRemoveFiles 先于 customUnInstall 执行，
;   提前删除会导致后者读不到值；统一由最后的消费者 customUnInstall 清理。
!macro ResolveDeleteDataFlag _out
  StrCpy $updatedFlow "0"
  ClearErrors
  ${GetParameters} $R9
  ${GetOptions} $R9 "--updated" $R8
  ${If} ${Errors}
    StrCpy ${_out} $deleteDataFlag
  ${Else}
    StrCpy $updatedFlow "1"
    ReadRegStr ${_out} HKCU "Software\时光信笺" "OverwriteData"
    ${If} ${_out} != "1"
      StrCpy ${_out} "0"
    ${EndIf}
  ${EndIf}
!macroend

; 文件清理：完全接管默认的 RMDir /r $INSTDIR，以支持「保留 data」分支。
; 注意：接管后失去了模板 atomicRMDir 的失败回滚能力，文件被占用（应用仍在运行）时
; 会进入中间态；此处通过 DetailPrint 输出失败项，便于日志定位。
; 另注意：删除前必须先 SetOutPath 移出 $INSTDIR（见宏内注释）。
!macro customRemoveFiles
  !insertmacro ResolveDeleteDataFlag $R9
  ; 必须先把进程当前目录移出 $INSTDIR：模板 un.onInit 的 SetOutPath $INSTDIR 会把
  ; 卸载器工作目录固定在安装目录，而 Windows 禁止删除作为进程 CWD 的目录——
  ; 不移走的话 RMDir（含 /r）只能清空目录内容，安装根目录本身永远删不掉，
  ; 卸载后会残留一个空安装目录（删除 data 或 data 已迁走时尤为明显）。
  SetOutPath $TEMP
  ${If} $R9 == "1"
    ClearErrors
    RMDir /r "$INSTDIR"
    ${If} ${Errors}
      DetailPrint "安装目录未能完全删除（应用可能仍在运行），残留文件由安装流程覆盖"
    ${EndIf}
  ${Else}
    ; 保留 data 与 config：仅删除安装目录内的其余内容（目录才判定，避免同名文件误留）
    StrCpy $R3 "0"
    FindFirst $R1 $R2 "$INSTDIR\*.*"
    rm_loop:
      StrCmp $R2 "" rm_done
      StrCmp $R2 "." rm_next
      StrCmp $R2 ".." rm_next
      IfFileExists "$INSTDIR\$R2\*.*" 0 rm_isfile
        StrCmp $R2 "data" rm_next
        StrCmp $R2 "config" rm_next
        ClearErrors
        RMDir /r "$INSTDIR\$R2"
        ${If} ${Errors}
          StrCpy $R3 "1"
        ${EndIf}
        Goto rm_next
      rm_isfile:
        ClearErrors
        Delete "$INSTDIR\$R2"
        ${If} ${Errors}
          StrCpy $R3 "1"
        ${EndIf}
      rm_next:
        FindNext $R1 $R2
        Goto rm_loop
    rm_done:
      FindClose $R1
      ; data 仍在目录内时该句删除失败，属预期
      RMDir "$INSTDIR"
      ${If} $R3 == "1"
        DetailPrint "部分文件被占用未能删除（应用可能仍在运行），已保留 data 目录"
      ${EndIf}
  ${EndIf}
!macroend

; 卸载收尾：按判定清理自定义数据文件夹
; config.ini 位于安装目录内：删除数据时已由 customRemoveFiles 整目录删除，
; 保留数据时随 config 目录一起保留
!macro customUnInstall
  !insertmacro ResolveDeleteDataFlag $R9
  ${If} $R9 == "1"
    StrCmp $customDataDirPath "" done
    ClearErrors
    RMDir /r "$customDataDirPath"
    ${If} ${Errors}
      DetailPrint "自定义数据目录未能完全删除（应用可能仍在运行）"
    ${EndIf}
  ${EndIf}
  ; 本宏是 OverwriteData 的最后消费者，覆盖安装流程结束时清理注册表值。
  ; 仅删值不删键：键若未来存放其他值，删键会造成连带损失，空键无副作用
  ${If} $updatedFlow == "1"
    DeleteRegValue HKCU "Software\时光信笺" "OverwriteData"
  ${EndIf}
  done:
!macroEnd
!endif ; BUILD_UNINSTALLER
