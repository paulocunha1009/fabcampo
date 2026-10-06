param(
  [string]$Workspace = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
$tutorialDir = Join-Path $Workspace 'materiais\organizacao-financeira\tutorial'
$scenesDir = Join-Path $tutorialDir 'cenas'
$audioDir = Join-Path $tutorialDir 'audio'
$jsonPath = Join-Path $tutorialDir 'roteiro.json'
$slidesPath = Join-Path $tutorialDir 'Tutorial_Organizacao_Financeira_Rural.pptx'
$videoPath = Join-Path $tutorialDir 'Tutorial_Organizacao_Financeira_Rural_1080p.mp4'
$vttPath = Join-Path $tutorialDir 'Tutorial_Organizacao_Financeira_Rural.pt-BR.vtt'

$scenes = Get-Content -Raw -LiteralPath $jsonPath | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Maria Desktop')
$synth.Rate = -1
$synth.Volume = 100

$durations = @()
for ($i = 0; $i -lt $scenes.Count; $i++) {
  $wav = Join-Path $audioDir ('narracao-{0:D2}.wav' -f ($i + 1))
  $synth.SetOutputToWaveFile($wav)
  $synth.Speak($scenes[$i].narration)
  $synth.SetOutputToNull()
  $reader = New-Object System.Media.SoundPlayer $wav
  $bytes = [System.IO.File]::ReadAllBytes($wav)
  $sampleRate = [BitConverter]::ToInt32($bytes, 24)
  $byteRate = [BitConverter]::ToInt32($bytes, 28)
  $dataSize = [BitConverter]::ToInt32($bytes, 40)
  $seconds = [Math]::Ceiling($dataSize / $byteRate) + 1.0
  $durations += $seconds
}
$synth.Dispose()

function Format-VttTime([double]$seconds) {
  $ts = [TimeSpan]::FromSeconds($seconds)
  return ('{0:00}:{1:00}:{2:00}.{3:000}' -f [Math]::Floor($ts.TotalHours), $ts.Minutes, $ts.Seconds, $ts.Milliseconds)
}
$vtt = @('WEBVTT','')
$cursor = 0.0
for ($i = 0; $i -lt $scenes.Count; $i++) {
  $start = $cursor
  $end = $cursor + $durations[$i]
  $vtt += ('{0} --> {1}' -f (Format-VttTime $start),(Format-VttTime $end))
  $vtt += [string]$scenes[$i].narration
  $vtt += ''
  $cursor = $end
}
[System.IO.File]::WriteAllLines($vttPath,$vtt,[System.Text.UTF8Encoding]::new($false))

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$pres = $ppt.Presentations.Add()
$pres.PageSetup.SlideWidth = 13.333333 * 72
$pres.PageSetup.SlideHeight = 7.5 * 72

for ($i = 0; $i -lt $scenes.Count; $i++) {
  $slide = $pres.Slides.Add($i + 1, 12)
  $img = Join-Path $scenesDir ('cena-{0:D2}.png' -f ($i + 1))
  [void]$slide.Shapes.AddPicture($img, 0, -1, 0, 0, $pres.PageSetup.SlideWidth, $pres.PageSetup.SlideHeight)
  $wav = Join-Path $audioDir ('narracao-{0:D2}.wav' -f ($i + 1))
  $media = $slide.Shapes.AddMediaObject2($wav, 0, -1, -10, -10, 1, 1)
  $media.AnimationSettings.PlaySettings.PlayOnEntry = -1
  $media.AnimationSettings.PlaySettings.HideWhileNotPlaying = -1
  $slide.SlideShowTransition.AdvanceOnTime = -1
  $slide.SlideShowTransition.AdvanceTime = [double]$durations[$i]
  $slide.SlideShowTransition.EntryEffect = 3849
}
$pres.SaveAs($slidesPath,24)
$pres.CreateVideo($videoPath,$true,1,1080,30,85)
$deadline = (Get-Date).AddMinutes(15)
while ($pres.CreateVideoStatus -in 1,2) {
  if ((Get-Date) -gt $deadline) { throw 'Tempo limite excedido ao gerar o vídeo.' }
  Start-Sleep -Seconds 5
}
if ($pres.CreateVideoStatus -ne 3) { throw "Falha ao gerar vídeo. Status: $($pres.CreateVideoStatus)" }
$pres.Close()
$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
Write-Output $videoPath
Write-Output $vttPath
