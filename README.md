# [file.gallery](https://file.gallery/)

germinate a site from files, directories, and .DS_Store. originally [kevin.garden](https://kevin.garden/).


## guide

in the root directory, run `npm run cultivate`. the cultivate script reads
all the files in your directory and traverses directories up to a certain depth,
and creates an `index.html` file displaying the contents of every directory it
visits.

```console
$ npm run cultivate
how do we turn a directory into a garden?
usage:      node cultivate.js DIR
options:    -h, --help       print help
```

there are two ways the script can display a directory: *natural* and *formal*.
- *formal* is the default. in the formal arrangement, files are sorted
lexicographically by file name and displayed in a tight grid.
- *natural* arranges files by their "physical" location (as shown in the finder
directory). to allow this, the directory must be set to "Sort By > None", *and*
you must have moved every file at least once.

add files, move them around, run `npm run cultivate`, rinse and repeat.

### capabilities

**for feach file,**

- file types that have direct html equivalents (\<img\>, \<video\>, \<audio\>)
are displayed using those tags.
  - images: jpeg, png, webp, gif, apng, svg, bmp, ico.
  - videos: mp4, webm.
  - audio: mp4, wav, ogg, m4a.
- markdown (md) files are parsed into pretty html.
- all other file types are shown as direct links with no display formatting.
- a file with no extension has its contents shown. these are good to use as
headers.

**in a directory,**

- arranges based on file positions, if every file has been moved
- mirrors a directory's background color (only works for solid colors). if the
background is dark enough, the text color will be set to white.
- recursively traverses sub-directories, up to three directories deep from
where the script was run. be careful - this can generate a lot of index.html
files if run in a large directory.

**special files,**

- .gardenignore specifies a list of files/directories that is ignored by the
cultivation script. add files here that you explicitly want to be hidden.
- (.gitignore does the same, but is used to hide extraneous system files.)
- .DS_Store is esteemed

### what .DS_Store holds

in every directory interfaced through the finder app, macos stores
finder-specific metadata in the .DS_Store file. normally hidden from view,
.DS_Store stores directory settings such as file positions, icon size, background
color, sort order, etc.

I have found that the best way to make the .DS_Store file update its metadata
is to delete the generated `index.html` file in the directory you made changes.
deleting a file seems to be a reliable way to trigger an update to the metadata
stored in the .DS_Store file.


## setup

1. clone this repository, or download everything as a .zip and unzip it.

2. install node.js and npm. to check if they are already installed, you should
be able to run `node -v` and `npm -v` in a terminal without seeing errors. if
they're not installed, you can follow the official instructions
[here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or 
get it through [homebrew](https://brew.sh/) via `brew install node`.

3. install python 3. check if you already have it installed: `python3 --version`.
to install via homebrew: `brew install python`.

4. open a terminal and navigate to this repository's directory. run `npm -i`.
you're ready to go.

5. the minimum set of files you'll need to keep is `package.json`, `.gitignore`,
`.gardenignore`, the `src` directory, and the `views` directory. `src` contains
the script that generates the site, and `views` contains the html templates that
format each page.


## what's changed

- 4/26/25:
  - performance enhancements, parallelize async operations
  - sort order is now name localeAware, might affect some display orders.
  previously, it was in the order readdir() returned
- 2/16/25: tweaked `formal.ejs` to be a bit less formal
- 4/12/24: add text-size-adjust (and webkit equiv)
- 4/8/24: for markdown files,
  - display file size
  - add `md` class to divs, add margins to inner tags
- 10/17/23: added gray border around items
- 10/9/23: added max recursion depth argument, defaults to 3
- 10/6/23: you can `node cultivate.js DIR` now!
  - just be very careful what directory you specify...

### todos

- add max recursion depth as a parameter for the script. today, the max depth
is set to 3. you can change this directly in the script 


## license

- `src/` — `parse.py` by [Thomas Zhu](https://github.com/hanwenzhu) is licensed under the MIT license. all other source code (in `src/`) is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
  - if modified, indicate it by adding it to the header comment, e.g. "modified by \[name\]: add jpeg xl support"
- `views/` — all templates and their styles are licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  - if modified, indicate it in the attribution, e.g. "modified by \[name\]"

for published websites, CC attribution only in the html source is sufficient. i'd appreciate a link to https://kevin.garden/ or https://file.gallery/ in the attribution. a visible reference on the website itself would be nice too, although optional. thank you!
