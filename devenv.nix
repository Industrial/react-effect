{
  pkgs,
  lib,
  config,
  inputs,
  ...
}: {
  dotenv = {
    enable = false;
    disableHint = true;
  };

  packages = with pkgs; [
    direnv
    gitFull
    jq
    stdenv.cc.cc

    bun

    actionlint
    alejandra
    beautysh
    biome
    deadnix
    prek
    taplo
    treefmt
    yamlfmt
  ];

  env = {
  };

  languages = {
    javascript = {
      enable = true;
      bun = {
        enable = true;
      };
    };
    typescript = {
      enable = true;
    };
  };

  scripts = {
    prek-install = {
      exec = ''
        prek install -q --overwrite
      '';
    };
  };

  enterShell = ''
    prek-install

    export PATH="${pkgs.biome}/bin:${pkgs.prisma}/bin:$PATH"

    if [ -d node_modules/.bin ]; then
      ln -sf "${pkgs.biome}/bin/biome" node_modules/.bin/biome
    fi
  '';
}
