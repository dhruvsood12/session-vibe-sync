from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class Track:
    id: int
    title: str
    artist: str
    album: str
    bpm: int
    energy: float
    duration: str
    genre: str
    danceability: float
    valence: float


# Demo catalog (mirrors src/data/trackDatabase.ts)
ALL_TRACKS: List[Track] = [
    Track(1, "Power", "Kanye West", "My Beautiful Dark Twisted Fantasy", 152, 0.89, "4:52", "Hip-Hop", 0.72, 0.63),
    Track(2, "FE!N", "Travis Scott", "UTOPIA", 146, 0.91, "3:31", "Hip-Hop", 0.68, 0.41),
    Track(3, "Nonstop", "Drake", "Scorpion", 134, 0.85, "3:58", "Hip-Hop", 0.77, 0.52),
    Track(4, "Superhero", "Metro Boomin", "Heroes & Villains", 141, 0.87, "3:42", "Hip-Hop", 0.71, 0.48),
    Track(5, "HUMBLE.", "Kendrick Lamar", "DAMN.", 150, 0.93, "2:57", "Hip-Hop", 0.83, 0.56),
    Track(6, "Blinding Lights", "The Weeknd", "After Hours", 171, 0.79, "3:20", "Synth-Pop", 0.81, 0.67),
    Track(7, "Stronger", "Kanye West", "Graduation", 104, 0.82, "5:12", "Hip-Hop", 0.73, 0.54),
    Track(8, "Till I Collapse", "Eminem", "The Eminem Show", 171, 0.95, "4:57", "Hip-Hop", 0.61, 0.35),
    Track(9, "Intro", "The xx", "xx", 100, 0.28, "2:07", "Indie", 0.42, 0.31),
    Track(10, "Nuvole Bianche", "Ludovico Einaudi", "Una Mattina", 67, 0.15, "5:57", "Classical", 0.18, 0.22),
    Track(11, "Weightless", "Marconi Union", "Weightless", 60, 0.12, "8:09", "Ambient", 0.11, 0.18),
    Track(12, "Avril 14th", "Aphex Twin", "Drukqs", 82, 0.19, "2:05", "Electronic", 0.23, 0.28),
    Track(13, "Gymnopédie No.1", "Erik Satie", "Gymnopédies", 68, 0.11, "3:29", "Classical", 0.14, 0.25),
    Track(14, "An Ending", "Brian Eno", "Apollo", 72, 0.13, "4:17", "Ambient", 0.09, 0.19),
    Track(15, "Flim", "Aphex Twin", "Come to Daddy", 92, 0.21, "2:54", "Electronic", 0.31, 0.34),
    Track(16, "Holocene", "Bon Iver", "Bon Iver", 108, 0.32, "5:36", "Indie Folk", 0.28, 0.21),
    Track(17, "Everything In Its Right Place", "Radiohead", "Kid A", 122, 0.52, "4:11", "Art Rock", 0.45, 0.35),
    Track(18, "Genesis", "Grimes", "Visions", 128, 0.61, "4:14", "Electronic", 0.58, 0.42),
    Track(19, "Night Owl", "Gerry Rafferty", "Night Owl", 112, 0.48, "4:49", "Soft Rock", 0.51, 0.55),
    Track(20, "Pink + White", "Frank Ocean", "Blonde", 98, 0.44, "3:04", "R&B", 0.47, 0.48),
    Track(21, "Electric Feel", "MGMT", "Oracular Spectacular", 120, 0.63, "3:49", "Indie Pop", 0.72, 0.61),
    Track(22, "Midnight City", "M83", "Hurry Up, We're Dreaming", 105, 0.71, "4:03", "Synth-Pop", 0.64, 0.58),
    Track(23, "Let It Happen", "Tame Impala", "Currents", 118, 0.56, "7:47", "Psychedelic Rock", 0.52, 0.44),
    Track(24, "Dissolve", "Absofacto", "Thousand Peaces", 96, 0.39, "3:28", "Indie Pop", 0.49, 0.39),
    Track(25, "Sunset Lover", "Petit Biscuit", "Petit Biscuit", 85, 0.31, "3:43", "Electronic", 0.44, 0.52),
    Track(26, "Skinny Love", "Bon Iver", "For Emma, Forever Ago", 76, 0.24, "3:58", "Indie Folk", 0.31, 0.19),
    Track(27, "Re: Stacks", "Bon Iver", "For Emma, Forever Ago", 72, 0.18, "6:41", "Indie Folk", 0.22, 0.15),
    Track(28, "Saturn", "SZA", "SOS", 88, 0.35, "3:25", "R&B", 0.48, 0.41),
    Track(29, "Breathe Me", "Sia", "Colour the Small One", 82, 0.27, "4:34", "Art Pop", 0.29, 0.23),
    Track(30, "Cherry Wine", "Hozier", "Hozier", 80, 0.22, "4:13", "Indie Folk", 0.34, 0.27),
    Track(31, "Redbone", "Childish Gambino", "Awaken My Love", 81, 0.42, "5:27", "Funk", 0.55, 0.44),
    Track(32, "Myth", "Beach House", "Bloom", 94, 0.38, "4:18", "Dream Pop", 0.41, 0.36),
    Track(33, "Resonance", "HOME", "Odyssey", 108, 0.45, "3:32", "Synthwave", 0.52, 0.48),
    Track(34, "Tadow", "Masego & FKJ", "Tadow", 98, 0.51, "5:48", "Jazz Fusion", 0.61, 0.55),
    Track(35, "Coffee", "Sylvan Esso", "Sylvan Esso", 118, 0.55, "3:31", "Indie Pop", 0.64, 0.52),
    Track(36, "Get Lucky", "Daft Punk", "Random Access Memories", 116, 0.58, "6:09", "Disco", 0.78, 0.71),
    Track(37, "Deadcrush", "alt-J", "Relaxer", 110, 0.49, "3:49", "Indie Rock", 0.53, 0.39),
    Track(38, "Warm On A Cold Night", "HONNE", "Warm On A Cold Night", 102, 0.43, "4:17", "Electronic R&B", 0.57, 0.46),
    Track(39, "Ivy", "Frank Ocean", "Blonde", 94, 0.38, "4:09", "R&B", 0.42, 0.31),
    Track(40, "Feels Like We Only Go Backwards", "Tame Impala", "Lonerism", 104, 0.47, "3:12", "Psychedelic Rock", 0.49, 0.44),
    Track(41, "Nightcall", "Kavinsky", "OutRun", 96, 0.55, "4:17", "Synthwave", 0.62, 0.38),
    Track(42, "After Dark", "Mr.Kitty", "Time", 108, 0.48, "4:18", "Darkwave", 0.55, 0.29),
    Track(43, "Nights", "Frank Ocean", "Blonde", 90, 0.42, "5:07", "R&B", 0.47, 0.32),
    Track(44, "Self Control", "Frank Ocean", "Blonde", 74, 0.31, "4:09", "R&B", 0.35, 0.18),
    Track(45, "Pyramids", "Frank Ocean", "Channel Orange", 86, 0.52, "9:52", "R&B", 0.51, 0.35),
    Track(46, "The Less I Know The Better", "Tame Impala", "Currents", 116, 0.58, "3:36", "Psychedelic Pop", 0.72, 0.59),
    Track(47, "Novacane", "Frank Ocean", "Nostalgia, Ultra", 98, 0.45, "5:01", "R&B", 0.49, 0.28),
    Track(48, "505", "Arctic Monkeys", "Favourite Worst Nightmare", 138, 0.67, "4:13", "Indie Rock", 0.44, 0.31),
]


def get_track(track_id: int) -> Optional[Track]:
    for t in ALL_TRACKS:
        if t.id == track_id:
            return t
    return None

