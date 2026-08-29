import type { Destination } from '../data/destinations';

interface CountryLandscapeProps {
  destination: Destination;
}

function Skyline() {
  return (
    <g className="landscape__skyline">
      <path d="M0 584V518h60v66h35v-104h58v104h38v-158h57v158h32v-88h76v88h48v-206h70v206h45v-130h82v130h37v-180h52v180h40v-103h68v103h50v-158h74v158h36v-83h59v83h58v-125h75v125h42v-202h62v202h38v-108h73v108h37v-161h61v161h47v-90h59v90h67V476h81v108h52v-124h73v124h49v-75h55v75h76v-112h71v112h52v-148h63v148h55v-79h75v79h73V528h55v56h70v-98h56v98h81v-53h53v53h54v78H0z" />
      <path className="landscape__reflection" d="M0 584h1440v136H0z" />
    </g>
  );
}

function Landmark({ destination }: CountryLandscapeProps) {
  switch (destination.key) {
    case 'singapore':
      return <g className="landscape__landmark"><path d="M596 482V238c0-15 12-27 27-27h194c15 0 27 12 27 27v244z" /><path d="M566 218c28-55 66-69 110-43 44-26 82-12 110 43" fill="none" stroke="currentColor" strokeWidth="19" /><path d="M511 196c28-28 65-31 89-8h152c25-23 62-20 89 8" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" /><path className="landscape__fine" d="M530 482V329m62 153V280m168 202V280m61 202V329" /></g>;
    case 'sydney':
      return <g className="landscape__landmark"><path d="M467 486c33-144 115-224 202-250-6 102-55 188-202 250z" /><path d="M635 486c24-160 115-246 211-275-1 126-66 225-211 275z" /><path d="M809 486c20-116 86-185 164-210-6 91-56 164-164 210z" /><path className="landscape__fine" d="M448 486h571" /></g>;
    case 'melbourne':
      return <g className="landscape__landmark"><path d="M510 484V355h80v-54h72v54h105v129z" /><path d="M488 354l62-73 61 73 58-73 59 73" /><path d="M692 281v-97l23-52 23 52v97" /><path className="landscape__fine" d="M542 386h26m39 0h26m34 0h26m35 0h26M542 425h26m39 0h26m34 0h26m35 0h26" /></g>;
    case 'guangzhou':
      return <g className="landscape__landmark"><path d="M696 486V179l-52-82 52-82 52 82-52 82v307z" /><path d="M596 436l100-258 100 258" fill="none" stroke="currentColor" strokeWidth="17" /><path d="M623 369h146M647 308h98M670 247h52" fill="none" stroke="currentColor" strokeWidth="12" /><circle cx="696" cy="113" r="28" fill="none" stroke="currentColor" strokeWidth="14" /></g>;
    case 'hong-kong':
      return <g className="landscape__landmark"><path d="M470 486V207h73v279m25 0V148h84v338m29 0V268h74v218m27 0V113h98v373m31 0V234h72v252m29 0V181h67v305" /><path d="M688 148l36-77 37 77m-195 0 44-100 43 100" fill="none" stroke="currentColor" strokeWidth="12" /><path className="landscape__fine" d="M432 486h615" /></g>;
    case 'taipei':
      return <g className="landscape__landmark"><path d="M645 486V187h102v299" /><path d="M626 221h140M620 267h152M614 315h164M607 364h178M597 418h198" fill="none" stroke="currentColor" strokeWidth="20" /><path d="M678 187V86l18-57 18 57v101" /><path className="landscape__fine" d="M670 244h52m-52 51h52m-52 50h52m-52 51h52" /></g>;
    case 'tokyo':
      return <g className="landscape__landmark"><path d="M604 486l92-374 92 374m-150-154h116m-137 85h158" fill="none" stroke="currentColor" strokeWidth="18" /><path d="M696 112V32m-43 151h86l-43-71z" /><path d="M619 486h154" fill="none" stroke="currentColor" strokeWidth="24" /></g>;
    case 'osaka':
      return <g className="landscape__landmark"><path d="M534 486V388h324v98m-285-98V296h246v92m-207-92V211h168v85" /><path d="M570 296l125-96 125 96m-287 92 162-104 162 104m-323 98 162-91 162 91" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round" /><path className="landscape__fine" d="M652 348h30m30 0h30m-90 82h30m30 0h30" /></g>;
    case 'seoul':
      return <g className="landscape__landmark"><path d="M646 486l50-343 50 343" /><path d="M696 143V52m-30 128h60l-30-79z" /><path d="M626 282h140m-163 100h186" fill="none" stroke="currentColor" strokeWidth="20" /><path className="landscape__mountain" d="M140 486l176-182 110 102 142-159 138 134 119-99 174 204z" /></g>;
    case 'busan':
      return <g className="landscape__landmark"><path d="M310 486c86-183 217-241 386-241s300 58 434 241" fill="none" stroke="currentColor" strokeWidth="20" /><path d="M390 486V283m609 203V272M390 328h640" fill="none" stroke="currentColor" strokeWidth="13" /><path className="landscape__fine" d="M470 326l70 160m31-160 44 160m254-160-58 160m93-160-80 160" /></g>;
    case 'disney-cruise':
      return <g className="landscape__landmark"><path d="M393 442h650l-98 77H504z" /><path d="M501 442V297h355l96 145" /><path d="M573 297v-82h177v82m40 0v-51h77v51" /><path className="landscape__fine" d="M533 340h277m-277 38h303m-252-126h54m24 0h54m-108 226h38m30 0h38m30 0h38m30 0h38" /></g>;
    default:
      return null;
  }
}

export function CountryLandscape({ destination }: CountryLandscapeProps) {
  return (
    <div className="country-landscape" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMax slice" role="presentation">
        <defs>
          <linearGradient id="land-water" x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient>
        </defs>
        <path className="landscape__horizon" d="M0 486h1440v234H0z" />
        <Skyline />
        <Landmark destination={destination} />
        <path className="landscape__waterline" d="M0 512c202-18 330 19 520 0 183-19 384 21 565-1 145-17 233 11 355-4v213H0z" />
      </svg>
    </div>
  );
}
