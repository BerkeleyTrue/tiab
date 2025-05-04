{
  description = "tiab - Thing in a Box - A Next.js application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        # Node.js version
        nodejs = pkgs.nodejs_20;

        # PNPM version from packageManager field
        pnpm = pkgs.pnpm_10;

        # Project name from package.json
        name = "tiab";
      in
      {
        # Package definition
        packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = name;
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [
            nodejs
            pnpm
            pnpm.configHook
          ];

          buildPhase = ''
            runHook preBuild
            pnpm run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r .next $out/
            cp -r public $out/
            cp -r node_modules $out/
            cp package.json $out/
            
            # Create a simple wrapper script to start the application
            mkdir -p $out/bin
            cat > $out/bin/${name} << EOF
              #!/bin/sh
              cd $out
              exec ${nodejs}/bin/node $out/node_modules/next/dist/bin/next start
            EOF
            chmod +x $out/bin/${name}
            runHook postInstall
          '';

          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            hash = "sha256-sz0jOS2sV+rYrdHgIvYarL6+0hhyj5vZA2rtMDcrkHE="; # Replace with actual hash
          };
          
          meta = {
            mainProgram = name;
          };
        });

        # App definition for running with `nix run`
        apps.default = {
          type = "app";
          description = "Tiab application - A personal storage solution";
          program = "${self.packages.${system}.default}/bin/${name}";
        };
      });
}
