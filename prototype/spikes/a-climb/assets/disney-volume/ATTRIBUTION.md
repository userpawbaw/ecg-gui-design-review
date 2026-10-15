# Disney VDB density derivatives — D138

Copyright 2017 Disney Enterprises, Inc. Original cloud density data: Walt Disney Animation Studios Cloud Data Set, https://www.disneyanimation.com/resources/clouds/ . Reference photograph: Kevin Udy, https://coclouds.com/436/cumulus/2012-07-26/ .

Original data and these modified density derivatives are licensed under Creative Commons Attribution-ShareAlike 3.0 Unported: https://creativecommons.org/licenses/by-sa/3.0/ . Original package license: https://media.disneyanimation.com/uploads/production/data_set_asset/6/asset/License_Cloud.pdf . No endorsement implied.

Changes: quarter-resolution source resampled by trilinear interpolation to192×96×192; density normalized to99.5th positive percentile, sqrt encoded asR8; separate Gaussian sigma3 voxel coarse field. Neither file contains baked lighting, measured northern weather, or real-world dimensions. Source/hash/conversion settings inmanifest.json and scripts/assets/prepare-disney-volume.py.
