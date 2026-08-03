# [file.gallery](https://file.gallery/)

germinate a website from files, directories, and .DS_Store.

file.gallery is [sisters](https://en.wikipedia.org/wiki/Sister_city)
with [kevin.garden](https://github.com/inchkev/garden).


## guide

in the root directory, run `npm run cultivate`.

```console
$ npm run cultivate
how do we turn a directory into a garden?
usage:      node cultivate.js DIR
options:    -h, --help       print help
```

the cultivate script reads all the files in your directory and traverses
directories up to a certain depth, and creates an `index.html` file displaying
the contents of every directory it visits.

there are two ways the script can display a directory: *natural* and *formal*.
- *formal* is the default. in the formal arrangement, files are sorted
lexicographically by file name and arranged in a tight grid.
- *natural* arranges files by their "physical" location (as shown in the finder
directory). to allow this, the directory must be set to "Sort By > None" and
you must have moved _every_ visible file at least once.

add files, move them around, run `npm run cultivate`, rinse and repeat.

### capabilities

**for each file,**

- file types that have direct html equivalents (\<img\>, \<video\>, \<audio\>)
are displayed using those tags. supported file extensions:
  - *images*: jpeg, png, webp, gif, apng, svg, bmp, ico
  - *videos*: mp4, webm
  - *audio*: mp3, wav, ogg, m4a
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

### what does .DS_Store hold?

in every directory interfaced through the finder app, macos stores
finder-specific metadata in the .DS_Store file. normally hidden from view,
.DS_Store stores directory settings such as file positions, icon size, background
color, sort order, etc.

if you're interested in learning more about .DS_Store, start with the README
of the parser script file.gallery uses,
[.DS_Store-parser](https://github.com/hanwenzhu/.DS_Store-parser#readme), by
[hanwenzhu](https://github.com/hanwenzhu/).

### how do you update .DS_Store?

certain actions reliably update the contents of .DS_Store:

- it updates on file creation/deletion. so you could delete `index.html` (which is
generated anyways) in the directory you made changes. this is particularly nice
when combined with a file watcher (like fswatch). I use this for kevin.garden!
I run this script [`watch.sh`](https://github.com/inchkev/garden/blob/main/watch.sh),
which automatically calls cultivate.js when it sees that a file has changed/been added or removed.
- it also updates when you change the view configuration of the directory, like
when you change from viewing as icons to viewing as a list. this maps to a really
handy keyboard shortcut: `cmd+2` to switch to list view, then `cmd+1` to switch
back to icon view. thank you [rgbivvv](https://github.com/rgbivvv/) for this suggestion!
- there are certainly more update conditions but I found these two the most relevant.


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
the script that generates the website, and `views` contains the html templates
that format each page.


## changelog

- 8/2/2026: standardize max width/height for natural and formal layouts
- 1/25/26: set max-width to 30em
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

- `src/` — `cultivate.js` is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
  - if modified, indicate it by adding it to the header comment, e.g. "modified by \[name\]: add jpeg xl support"
  - the `LICENSE` file is only for code. publish it on your site if `cultivate.js` (or the entire `src/` directory) is published as well, as is the case currently. if you hide the `src/` directory (e.g. using `.gardenignore`), you should hide `LICENSE` as well.
- `src/` — `parse.py` by [Thomas Zhu](https://github.com/hanwenzhu) is licensed under the MIT license.
- `views/` — all templates and their styles are licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  - if modified, indicate it in the attribution, e.g. "modified by \[name\]"
- the license for site content (published images, text, etc) should be described on the site itself.

### attribution

for published websites, having the creative commons attribution _only_ in the
html source is sufficient. it's already there in the bottom of the .ejs template
files. i'd also appreciate it if the link to https://kevin.garden/ or
https://file.gallery/ were kept in the attribution text :\)

thank you!
