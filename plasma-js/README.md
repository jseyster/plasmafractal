Plasma Legacy
=============

This directory contains a BSD-licensed re-implementation of the original 2002 Java plasma fractal
project that is written in modern JavaScript. The new version is intended to behave exactly as the
old version did but with a more succinct coding style.

You can compare `plasma-legacy.js` to the original
[`Plasma.java`](https://github.com/jseyster/plasmafractal/blob/master/Plasma.java) to see if you
agree with the assesment that the new implementation is pithier or to observe how 20 years of
writing computer programs affects a person's brain.

Performance
-----------

When this program was originally written in Java, JavaScript was not a mature enough technology for
even a moderately compute-intensive application like this one. However, courtesy of Moore's law, two
decades of advancements in CPU performance, and the non-stop innovation of modern web technology, a
state-of-the-art M1 Max can use JavaScript to compute the plasma fractal's "midpoint displacement"
algorithm at speeds comparable to the original Java program running on a Pentium II with Windows XP.

Embedding
---------

This new version is a Web Component that can be embedded on any site:

    <script type="module" src="https://cdn.jsdelivr.net/gh/jseyster/plasmafractal@master/plasma-js/plasma-legacy.esm.min.js"></script>
    <plasma-fractal style="width: 512px; height: 512px;"></plasma-fractal>

Note that embedding a cross-domain script with a Web Worker (including this one) requires hacks that
will not work in every environment. Currently, Firefox cannot embed this script using the above URL.
There is a good chance that future updates will break compatibility with other browsers, as well.

For the best possible compatibility across platforms, you can host your own copy of the `.js` files
in this directory. Perhaps having your own copy of the source will inspire you to tinker with it as
well!
