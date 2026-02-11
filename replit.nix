{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript-language-server
    # Required for better-sqlite3 native compilation
    pkgs.python3
    pkgs.gcc
    pkgs.gnumake
    pkgs.pkg-config
  ];
}
