# Copyright 2023-2025 Kevin N. Chen
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from collections import defaultdict
import json
import parse as dsparse
import plistlib
import sys

if __name__ == '__main__':
    if len(sys.argv) == 2:
        filepath = sys.argv[1]
    elif len(sys.argv) == 1:
        print(f'File unspecified. Use python3 {sys.argv[0]} <.DS_Store file>'
              ' to specify file. Defaulting to .DS_Store in the current'
              ' directory...', file=sys.stderr)
        filepath = '.DS_Store'
    else:
        print(f'Usage: python3 {sys.argv[0]} <.DS_Store file>')
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 main.py <DS_STORE FILE>")

    with open(filepath, 'rb') as file:
        content = file.read()

    result = defaultdict(dict)
    ds_store = dsparse.DSStore(content)
    for record in ds_store.read():
        filename = record.name

        iloc_data = record.fields.get('Iloc')
        if iloc_data is not None \
                and isinstance(iloc_data, bytes) and len(iloc_data) == 16:
            x = int.from_bytes(iloc_data[0:4], 'big', signed=False)
            y = int.from_bytes(iloc_data[4:8], 'big', signed=False)
            result[filename]['Iloc'] = {'x': x, 'y': y}
        
        icvp_data = record.fields.get('icvp')
        if icvp_data is not None \
                and isinstance(icvp_data, bytes):
            icvp_dict = plistlib.loads(icvp_data, fmt=plistlib.FMT_BINARY)

            backgroundType = icvp_dict.get('backgroundType')
            result[filename]['icvp'] = {
                'arrangeBy': icvp_dict['arrangeBy'],
                'iconSize': icvp_dict['iconSize'],
                'bgType': backgroundType,
            }

            # type = 0 : Default, 1: Color, 2: Image
            if backgroundType == 1:
                result[filename]['icvp'].update({
                    'bgR': int(icvp_dict['backgroundColorRed'] * 255),
                    'bgG': int(icvp_dict['backgroundColorGreen'] * 255),
                    'bgB': int(icvp_dict['backgroundColorBlue'] * 255),
                })

    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()
