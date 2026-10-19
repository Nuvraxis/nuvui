#!/usr/bin/env bash
# Makes the clips the docs, the blocks and the tests play, from ffmpeg's
# own generated sources: three colored parts with a moving light, their
# names and a timer, over a soft beep each second whose note changes with
# the part. Nothing is downloaded. The WebVTT files beside the clips are
# written by hand.
#
# Run where there's ffmpeg with libx264, libvpx and libopus, and the
# DejaVu fonts, such as a Debian container:
#
#   apt-get install ffmpeg fonts-dejavu-core
#   bash packages/media/scripts/make-media.sh <out> [video|audio]
#
# <out>/site has what the docs and the website serve, and <out>/fixtures
# the small clips the tests use. With video or audio, only those are made,
# so the files of the other stay as they are in git. Audio reads the demo
# video and sound, demo_video.mp4 and demo_audio.mp3, from <out>/site, and
# needs Node too, for the waveform's peaks.
set -euo pipefail

out=${1:?say where to write the clips}
only=${2:-all}
here=$(cd "$(dirname "$0")" && pwd)
bold=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mono=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }

# The picture and the sound of a clip <seconds> long at <width>x<height>,
# as a filter graph with [v] and [a] out.
graph() {
  local w=$1 h=$2 d=$3
  local part ball size
  part=$(awk "BEGIN { print $d / 3 }")
  ball=$((h / 3))
  size=$((h / 9))
  cat <<EOF
color=c=0x312e81:s=${w}x${h}:r=30:d=${part}[p1];
color=c=0x115e59:s=${w}x${h}:r=30:d=${part}[p2];
color=c=0x7c2d12:s=${w}x${h}:r=30:d=${part}[p3];
[p1][p2][p3]concat=n=3:v=1:a=0[bg];
color=c=black@0:s=${ball}x${ball}:r=30:d=${d},format=rgba,
geq=r=255:g=255:b=255:a='72*lt(hypot(X-W/2\,Y-H/2)\,W/2)'[light];
[bg][light]overlay=x='mod(t*${w}/6\,W+w)-w':y='(H-h)/2+sin(t*1.3)*H/6':shortest=1,
drawtext=fontfile=${bold}:text='nuvui':fontcolor=white@0.85:fontsize=${size}:x=${size}:y=${size},
drawtext=fontfile=${bold}:text='Getting started':fontcolor=white:fontsize=$((size * 5 / 4)):x=(w-tw)/2:y=(h-th)/2:enable='lt(t,${part})',
drawtext=fontfile=${bold}:text='Building the screen':fontcolor=white:fontsize=$((size * 5 / 4)):x=(w-tw)/2:y=(h-th)/2:enable='between(t,${part},2*${part})',
drawtext=fontfile=${bold}:text='Shipping it':fontcolor=white:fontsize=$((size * 5 / 4)):x=(w-tw)/2:y=(h-th)/2:enable='gte(t,2*${part})',
drawtext=fontfile=${mono}:text='%{eif\:floor(t/60)\:d}\:%{eif\:mod(floor(t)\,60)\:d\:2}':fontcolor=white:fontsize=${size}:x=w-tw-${size}:y=h-th-${size},
format=yuv420p[v];
aevalsrc='0.18*sin(2*PI*if(lt(t,${part}),440,if(lt(t,2*${part}),554.37,659.25))*t)*lt(mod(t,1),0.12)':s=48000:d=${d},
aformat=channel_layouts=stereo[a]
EOF
}

# clip <name> <width> <height> <seconds> <dir>: an MP4 and a WebM.
clip() {
  local name=$1 w=$2 h=$3 d=$4 dir=$5
  mkdir -p "$dir"
  ff -filter_complex "$(graph "$w" "$h" "$d")" -map "[v]" -map "[a]" \
    -c:v libx264 -preset slow -crf 30 -g 60 -keyint_min 60 -sc_threshold 0 \
    -c:a aac -b:a 64k -movflags +faststart "$dir/$name.mp4"
  ff -i "$dir/$name.mp4" -c:v libvpx-vp9 -crf 42 -b:v 0 -g 60 -row-mt 1 \
    -c:a libopus -b:a 48k "$dir/$name.webm"
}

# streams <source mp4> <dir> <small height> <large height>: HLS and DASH
# with two qualities each, in H.264, which every engine the tests run plays.
streams() {
  local source=$1 dir=$2 small=$3 large=$4
  mkdir -p "$dir/hls" "$dir/dash"
  # The sound is in each quality, so the list of qualities has no entry
  # that's sound alone. The segments are fragmented MP4 rather than MPEG-TS,
  # whose .ts files every tool in the repository would take for TypeScript.
  ff -i "$source" -map 0:v -map 0:a -map 0:v -map 0:a \
    -c:v libx264 -preset slow -crf 30 -g 60 -keyint_min 60 -sc_threshold 0 \
    -filter:v:0 "scale=-2:${small}" -filter:v:1 "scale=-2:${large}" -c:a aac -b:a 64k \
    -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type fmp4 \
    -hls_fmp4_init_filename "%v-init.mp4" \
    -hls_segment_filename "$dir/hls/%v-%03d.m4s" \
    -master_pl_name index.m3u8 -var_stream_map "v:0,a:0 v:1,a:1" \
    "$dir/hls/%v.m3u8"
  ff -i "$source" -map 0:v -map 0:v -map 0:a \
    -c:v libx264 -preset slow -crf 30 -g 60 -keyint_min 60 -sc_threshold 0 \
    -filter:v:0 "scale=-2:${small}" -filter:v:1 "scale=-2:${large}" -c:a aac -b:a 64k \
    -f dash -seg_duration 2 -use_template 1 -use_timeline 0 \
    -adaptation_sets "id=0,streams=v id=1,streams=a" "$dir/dash/index.mpd"
}

# frames <source> <dir> <every> <columns> <rows> <width>: one picture of
# a frame every <every> seconds, for the preview over the seek bar.
frames() {
  local source=$1 dir=$2 every=$3 columns=$4 rows=$5 width=$6
  ff -i "$source" -vf "fps=1/${every},scale=${width}:-2,tile=${columns}x${rows}" \
    -frames:v 1 -q:v 5 "$dir/thumbnails.jpg"
}

# peaks <mp3> <count>: the waveform's peaks beside it, as JSON.
peaks() {
  local file=$1 count=$2
  ffmpeg -hide_banner -loglevel error -i "$file" -ac 1 -ar 8000 -f f32le - |
    node "$here/peaks-from-pcm.mjs" "$count" >"${file%.mp3}.peaks.json"
}

if [ "$only" != audio ]; then
  site="$out/site"
  clip demo 1280 720 24 "$site"
  ff -i "$site/demo.mp4" -vf scale=640:360 -c:v libx264 -preset slow -crf 30 \
    -g 60 -keyint_min 60 -sc_threshold 0 -c:a copy -movflags +faststart "$site/demo-360.mp4"
  mv "$site/demo.mp4" "$site/demo-720.mp4"
  mv "$site/demo.webm" "$site/demo-720.webm"
  streams "$site/demo-720.mp4" "$site" 360 720
  frames "$site/demo-720.mp4" "$site" 2 4 3 160
  ff -ss 1 -i "$site/demo-720.mp4" -frames:v 1 -vf scale=960:-2 -q:v 4 "$site/poster.jpg"

  fixtures="$out/fixtures"
  clip clip 320 180 6 "$fixtures"
  streams "$fixtures/clip.mp4" "$fixtures" 180 360
  frames "$fixtures/clip.mp4" "$fixtures" 2 3 1 96
fi

if [ "$only" != video ]; then
  # From the demo video and sound beside them in <out>/site, which aren't
  # made here: the video's poster, the sound's artwork from a frame of the
  # video, and the sound's peaks, for the whole and for a voice message.
  site="$out/site"
  ff -ss 2.5 -i "$site/demo_video.mp4" -frames:v 1 -vf scale=960:-2 -q:v 4 "$site/demo_video.jpg"
  ff -ss 4.5 -i "$site/demo_video.mp4" -frames:v 1     -vf "crop=ih:ih:(iw-ih)/2:0,scale=600:600" -q:v 4 "$site/demo_audio.jpg"
  peaks "$site/demo_audio.mp3" 400

  # Four seconds quiet and four loud, so the tests know the peaks to expect.
  fixtures="$out/fixtures"
  mkdir -p "$fixtures"
  ff -f lavfi -i "aevalsrc='if(lt(t,4),0.1,0.8)*sin(2*PI*440*t)':s=44100:d=8"     -ac 1 -c:a libmp3lame -b:a 64k "$fixtures/tone.mp3"
fi

du -ah "$out" | sort -k2
