{
  description = "jbrowse2-plugin-bdgp-rest-api";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.flake-utils = {
    url = "github:numtide/flake-utils";
    inputs.nixpkgs.follows = "nixpkgs";
  };
  inputs.nix-npm-buildpackage.url = "github:serokell/nix-npm-buildpackage";
  outputs = { self, nixpkgs, flake-utils, nix-npm-buildpackage }:
  flake-utils.lib.eachDefaultSystem (system:
    let pkgs = nixpkgs.legacyPackages.${system}; in 
    rec {
      packages = flake-utils.lib.flattenTree rec {
        jbrowse2-plugin-bdgp-rest-api = pkgs.stdenv.mkDerivation rec {
          src = ./.;
          pname = "jbrowse2-plugin-bdgp-rest-api";
          version = "1.0.1";
          buildInputs = [ pkgs.nodejs pkgs.yarn pkgs.nodePackages.node-pre-gyp ];
          buildPhase = ''
          PREFIX=$PWD/.yarn HOME=$PWD PATH=$PWD/node_modules/.bin:$PATH yarn
          '';
          installPhase = ''
          mkdir -p "$out"/jbrowse2-plugin-bdgp-rest-api
          cp -a dist "$out"/jbrowse2-plugin-bdgp-rest-api
          '';
          outputHash = "1qzw955ba0iaigsvhsi7qgg8516804lp1zwlrl05gwi0wmj0whm4";
          outputHashMode = "recursive";
          outputHashAlgo = "sha256";
        };
      };
      defaultPackage = packages.jbrowse2-plugin-bdgp-rest-api;
    }
  );
}
